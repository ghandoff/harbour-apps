import Image from "next/image";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed bottom-6 left-6 z-10 ${className}`}>
      <Image
        src="/wordmark/wv-cadet.svg"
        alt="winded.vertigo"
        width={132}
        height={24}
        priority
      />
    </div>
  );
}
