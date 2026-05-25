type Props = {
  className?: string;
};

export function Wordmark({ className = "" }: Props) {
  return (
    <span className={`font-extrabold tracking-[-0.5px] ${className}`}>
      Day<span className="text-daytapes-accent">T</span>apes
    </span>
  );
}
