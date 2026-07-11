import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  key: number;
}

// Guards against a render-time exception silently killing the whole app.
// This matters most for the Display window: if a synced snapshot ever
// carries a value combination that throws during render, React unmounts
// the entire tree — which tears down the Display window's sync listeners
// (BroadcastChannel/storage) for good, since their cleanup functions run
// on unmount. Catching here and remounting on a fresh key re-establishes
// those listeners instead of leaving the tab permanently stuck.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, key: 0 };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("wāv render error — recovering:", error, info);
    setTimeout(() => {
      this.setState((s) => ({ hasError: false, key: s.key + 1 }));
    }, 300);
  }

  render() {
    if (this.state.hasError) return null;
    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
