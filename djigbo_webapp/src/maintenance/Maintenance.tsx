import React from "react";
import { useAuth0 } from "@auth0/auth0-react";


export const Maintenance: React.FC = () => {
    const { loginWithRedirect } = useAuth0();

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
            fontFamily: "Palemonas, 'Times New Roman', Times, serif",
            zIndex: 9999,
        }}>
            <h1 style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "#a68a64"
            }}>
                Djigbo kuriasi ir auga
            </h1>
            <p style={{
                fontSize: "1.1rem",
                color: "#a68a64",
                marginBottom: "2rem"
            }}>
                susitiksime jau greitai
            </p>
            <button
                style={{
                    padding: "0.75rem 2rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#fff",
                    background: "linear-gradient(135deg, #8b7355 0%, #a68a64 100%)",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(166, 138, 100, 0.08)",
                    transition: "all 0.2s",
                    fontFamily: "Palemonas, 'Times New Roman', Times, serif",
                }}
                onClick={() => loginWithRedirect()}
                onMouseOver={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #a68a64 0%, #7a6347 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(166, 138, 100, 0.3)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b7355 0%, #a68a64 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(166, 138, 100, 0.08)';
                }}
            >
                prisijungti testavimui
            </button>
        </div >
    );
};
