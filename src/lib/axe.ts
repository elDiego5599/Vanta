export async function runAxe() {
  if (import.meta.env.DEV) {
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const { default: axe } = await import('@axe-core/react');
    axe(React, ReactDOM, 1000);
  }
}
