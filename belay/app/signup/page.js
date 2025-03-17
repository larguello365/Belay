"use client";

import styles from "../page.module.css"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Link from 'next/link'

export default function Signup() {
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

    const handleSignup = async (event) => {
        event.preventDefault();

        // Clear any previous error messages
        setErrorMessage("");

        // Make the POST request to the backend
        try {
            const response = await fetch("http://localhost:8000/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: username, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Account created successfully!");
                localStorage.setItem("larguello1_belay_api_key", data.api_key);
                router.push("/");
            } else {
                console.error("An error occurred. Please try again.", data.error);
            }
        } catch (error) {
            console.log("An unexpected error occurred: ", error);
        }
    };

    return (
        <div className={styles.appContainer}>
            <div className={styles.loginContainer}>
                <h1 className={styles.title}>Create an Account</h1>
                <form onSubmit={handleSignup}>
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
                        Sign Up
                    </button>
                </form>
                <p className={styles.signupquest}>
                    Already have an account?{' '}
                    <Link href="/login">
                        <button type="button" className={styles.button}>
                            Login
                        </button>
                    </Link>
                </p>
            </div>
        </div>
    );
}