"use client";

import styles from "../page.module.css"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();
    const apiKey = localStorage.getItem("larguello1_belay_api_key");

    useEffect(() => {
        // If the user is already logged in, redirect to the homepage
        if (apiKey) {
            router.push("/");
        }
    }, [router]);

    const handleLogin = async (event) => {
        event.preventDefault();

        // Clear any previous error messages
        setErrorMessage("");

        // Make the POST request to the backend
        try {
            const response = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: username, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the API key in localStorage or sessionStorage
                localStorage.setItem("larguello1_belay_api_key", data.api_key);
                alert("Login successful!");

                router.push("/");
            } else {
                console.error("An error occurred", data.error);
            }
        } catch (error) {
            console.log("An unexpected error occurred: ", error);
        }
    };

    return (
        <div className={styles.appContainer}>
            <div className={styles.loginContainer}>
                <h1 className={styles.title}>Login to Belay</h1>
                <form onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <button type="submit" className={styles.button}>
                        Login
                    </button>

                </form>
                <p className={styles.signupquest}>
                    Don't have an account?{' '}

                    <button type="button" className={styles.button} onClick={() => router.push("/signup")}>
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    )
}