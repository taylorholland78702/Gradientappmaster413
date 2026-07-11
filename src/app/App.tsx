import { InteractiveGradient } from "./components/InteractiveGradient";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <div className="size-full flex items-center justify-center">
      <ErrorBoundary>
        <InteractiveGradient />
      </ErrorBoundary>
    </div>
  );
}