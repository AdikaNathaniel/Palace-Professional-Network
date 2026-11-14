import { useTypewriter } from '../hooks/useTypewriter';

type Props = {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
};

export default function TypewriterHeading({ text, speedMs, startDelayMs }: Props) {
  const { displayed, done } = useTypewriter(text, speedMs, startDelayMs);

  return (
    <span className="typewriter">
      <span aria-hidden="true">
        <span className="typewriter-text">{displayed}</span>
        <span className={`typewriter-cursor ${done ? 'blink' : ''}`}>|</span>
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
