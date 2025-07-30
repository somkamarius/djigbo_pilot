import React from "react";

export const Loading: React.FC = () => {
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "rgb(242, 241, 239)",
            color: "#5C4A2D",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            zIndex: 9999,
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem"
            }}>
                <div style={{
                    display: "flex",
                    gap: "0.5rem"
                }}>
                    <span style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#a68a64",
                        animation: "loadingBounce 1.4s ease-in-out infinite both"
                    }}></span>
                    <span style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#a68a64",
                        animation: "loadingBounce 1.4s ease-in-out infinite both",
                        animationDelay: "-0.16s"
                    }}></span>
                    <span style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#a68a64",
                        animation: "loadingBounce 1.4s ease-in-out infinite both",
                        animationDelay: "-0.32s"
                    }}></span>
                </div>
                <p style={{
                    fontSize: "1.2rem",
                    color: "#a68a64",
                    fontWeight: 600,
                    margin: 0
                }}>
                    Kraunama...
                </p>
            </div>
            <style>{`
                @keyframes loadingBounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}; 