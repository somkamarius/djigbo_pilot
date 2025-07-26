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
            background: "#f5f6fa",
            color: "#222",
            fontFamily: "sans-serif",
            zIndex: 9999,
        }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem" }}>
                Djigbo kuriasi ir auga
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: "2rem" }}>
                susitiksime jau greitai
            </p>
            <button
                style={{
                    padding: "0.75rem 2rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#fff",
                    background: "#007bff",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "background 0.2s",
                }}
                onClick={() => loginWithRedirect()}
                onMouseOver={e => (e.currentTarget.style.background = '#0056b3')}
                onMouseOut={e => (e.currentTarget.style.background = '#007bff')}
            >
                prisijungti testavimui
            </button>
        </div >
    );
};
