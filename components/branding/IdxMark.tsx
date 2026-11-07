/** The user's supplied IDX Terminal logo mark, traced from the original graphic. */
export function IdxMark({
  width=64,height=32,className,decorative=false,
}:{
  width?:number;height?:number;className?:string;decorative?:boolean;
}){
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 360"
      width={width} height={height} className={className}
      role={decorative?undefined:"img"}
      aria-hidden={decorative?true:undefined}
      aria-label={decorative?undefined:"IDX Terminal logo"}>
    <path fill="var(--color-ink-hi)" d="M21,347 L126,348 L130,345 L245,106 L254,99 L371,99 L380,101 L402,112 L434,148 L437,155 L358,238 L339,250 L314,257 L211,258 L167,346 L168,348 L337,347 L365,340 L387,330 L408,316 L424,301 L561,148 L482,51 L460,31 L427,14 L403,9 L188,9 L184,12 L114,153 Z"/>
    <path fill="#ff090c" d="M819,1 L703,1 L689,6 L679,15 L563,149 L579,164 L599,172 L653,172 L665,167 Z"/>
    <path fill="var(--color-ink-hi)" d="M528,245 L609,344 L614,347 L739,347 L623,208 L535,240 Z"/>
  </svg>;
}
