"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md shadow-sm max-w-2xl w-full text-left">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-4 shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800">Unexpected Error</h3>
                <div className="mt-2 text-sm text-red-700 font-mono bg-red-100/50 p-3 rounded overflow-auto max-h-32">
                  {this.state.error?.message || "An unknown error occurred"}
                </div>
                <p className="mt-4 text-sm text-red-600">
                  We encountered an unexpected issue while rendering this component. You can try reloading the page or retrying the action.
                </p>
                <div className="mt-6 flex space-x-4">
                  <Button
                    onClick={this.handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-red-200 text-red-700 hover:bg-red-100"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
