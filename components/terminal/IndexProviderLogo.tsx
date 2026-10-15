import Image from "next/image";

export function IndexProviderLogo({ provider }: { provider: "MSCI" | "FTSE Russell" }) {
  const msci = provider === "MSCI";
  return <span className="grid h-11 w-[4.25rem] shrink-0 place-items-center border border-rule-hi bg-white p-1" aria-label={`Logo resmi ${provider}`}>
    <Image
      src={msci ? "/index-providers/msci-logo.png" : "/index-providers/ftse-russell-logo.svg"}
      alt={provider}
      width={msci ? 60 : 55}
      height={msci ? 16 : 22}
      className="max-h-full w-auto object-contain"
    />
  </span>;
}
