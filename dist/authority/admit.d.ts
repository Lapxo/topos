/** Segment boundary, not string prefix — `acme/user` must not bind `acme/userdata`. */
export declare function under(prefix: string, scope: string): boolean;
