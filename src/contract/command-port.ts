export interface CommandPort {
  readonly coordinate:string;
  readonly implementation:string;
  readonly closure:readonly string[];
  readonly timeoutMs:number;
  readonly responseBytes:number;
  readonly environment:readonly string[];
  readonly stderr:'reject'|'retain';
}
export interface CommandLot {
  readonly identity:string;
  /** Payloads are interpreted by the selected world, never by the host. */
  readonly requests:readonly string[];
}

/** Selection is pure. Verification and coverage are supplied by the admitted
 * host boundary, not inferred from a URL, an archive or the implementation's
 * own output. No key material, filesystem or execution enters this module. */
export function checkCommandPort(port:CommandPort,checks:{
  readonly admitsDeclaration:(port:CommandPort)=>boolean;
  readonly covers:(coordinate:string)=>boolean;
  readonly verifies:(digest:string)=>boolean;
}):void {
  if(!checks.admitsDeclaration(port))throw Error(`REFUSE·port ${port.coordinate||'(absent)'} declaration not admitted`);
  if(!port.coordinate.startsWith('port/')||!checks.covers(port.coordinate))
    throw Error(`REFUSE·port ${port.coordinate||'(absent)'} not covered`);
  if(!port.implementation||!port.closure.includes(port.implementation)
    ||!port.closure.length||port.closure.some(digest=>!checks.verifies(digest)))
    throw Error(`REFUSE·port ${port.coordinate} unverified executable closure`);
  for(const [name,value] of [['timeout',port.timeoutMs],['response-bytes',port.responseBytes]] as const)
    if(!Number.isSafeInteger(value)||value<=0)throw Error(`REFUSE·port ${port.coordinate} invalid ${name}`);
  if(!['reject','retain'].includes(port.stderr)||port.environment.some(name=>!name||/[=\0]/.test(name)))
    throw Error(`REFUSE·port ${port.coordinate} invalid environment or stderr policy`);
}

/** command-lot@1 is one invocation per lot. It is framing only; it cannot
 * select a program or authorize effects. Identity is provided by the admitted
 * caller; successful response framing binds it and the implementation. */
export function commandRequest(port:CommandPort,lot:CommandLot):string {
  if(!lot.identity||!lot.requests.length||lot.requests.some(request=>typeof request!=='string'))throw Error(`REFUSE·port ${port.coordinate} empty, invalid or unnamed lot`);
  return JSON.stringify({protocol:'command-lot/1',coordinate:port.coordinate,
    implementation:port.implementation,identity:lot.identity,requests:lot.requests})+'\n';
}

export function commandResponse(port:CommandPort,lot:CommandLot,execution:{
  readonly status:number|null;readonly interrupted:boolean;readonly stdout:string;readonly stderr:string;
},accepts:(response:unknown,index:number)=>boolean):readonly unknown[] {
  // Response validation cannot bypass the request's lot contract.
  commandRequest(port,lot);
  if(execution.interrupted||execution.status!==0)
    throw Error(`REFUSE·port ${port.coordinate} ${execution.interrupted?'interrupted':`status ${execution.status}`}`);
  if(port.stderr==='reject'&&execution.stderr)throw Error(`REFUSE·port ${port.coordinate} stderr forbidden`);
  if(new TextEncoder().encode(execution.stdout).length>port.responseBytes)
    throw Error(`REFUSE·port ${port.coordinate} response-bytes exceeded`);
  if(!execution.stdout.endsWith('\n')||execution.stdout.slice(0,-1).includes('\n'))
    throw Error(`REFUSE·port ${port.coordinate} incomplete response frame`);
  let response:{protocol?:unknown;coordinate?:unknown;implementation?:unknown;identity?:unknown;responses?:unknown};
  try {response=JSON.parse(execution.stdout);}catch{throw Error(`REFUSE·port ${port.coordinate} invalid response frame`);}
  if(!response||response.protocol!=='command-lot/1'||response.coordinate!==port.coordinate
    ||response.implementation!==port.implementation||response.identity!==lot.identity
    ||!Array.isArray(response.responses)||response.responses.length!==lot.requests.length)
    throw Error(`REFUSE·port ${port.coordinate} response does not bind this lot`);
  // Validate the complete response before exposing any member for commitment.
  if(response.responses.some((member,index)=>!accepts(member,index)))
    throw Error(`REFUSE·port ${port.coordinate} invalid response member`);
  return response.responses;
}
