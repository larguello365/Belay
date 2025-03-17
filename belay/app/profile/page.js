"use client";

import styles from "../page.module.css"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Profile() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const apiKey = localStorage.getItem("larguello1_belay_api_key");

    useEffect(() => {
        if (!apiKey) {
            console.log("User is not logged in");
            router.push("/login");
        } else {
            console.log("User is logged in");

            fetch(`http://localhost:8000/api/user?api_key=${apiKey}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch user data");
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.error) {
                        console.error("Error", data.error);
                    } else {
                        setUsername(data.name);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching user data:", error);
                })
                .finally(() => setLoading(false));
        }
    }, [apiKey, router]);

    const handleLogout = () => {
        // Remove the API key from localStorage to log the user out
        localStorage.removeItem("larguello1_belay_api_key");

        // Redirect the user to the login page after logging out
        router.push("/login");
    };

    const updateUsername = () => {
        fetch("http://localhost:8000/api/user/name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                username: newUsername,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw response.json(); // Capture error response
                }
                return response.json();
            })
            .then((data) => {
                alert(data.message);
                setUsername(newUsername); // Update displayed username
                setNewUsername(""); // Clear input
            })
            .catch((error) => {
                error.then((errData) => alert(errData.error || "Failed to update username"));
            });
    };

    const updatePassword = () => {
        fetch("http://localhost:8000/api/user/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                password: newPassword,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw response.json(); // Capture error response
                }
                return response.json();
            })
            .then((data) => {
                alert(data.message);
                setNewPassword(""); // Clear input
            })
            .catch((error) => {
                error.then((errData) => alert(errData.error || "Failed to update password"));
            });
    };


    return (
        <div className={styles.appContainer}>
            <div className={styles.profileContainer}>
                <h1 className={styles.title}>Your Profile</h1>
                <form className={styles.profileForm}>
                    <div className={styles.inputGroup}>
                        <label>Username</label>
                        <div className={styles.inputButtonWrapper}>
                            <input 
                                type="text" 
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)} 
                                placeholder={username}/>
                            <button 
                                type="button" 
                                className={styles.updateButton}
                                onClick={updateUsername}>
                                Update
                            </button>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <div className={styles.inputButtonWrapper}>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="Enter new password" />
                            <button 
                                type="button" 
                                className={styles.updateButton}
                                onClick={updatePassword}>
                                Update
                            </button>
                        </div>
                    </div>
                </form>

                <button className={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>

                <Link href="/">
                    <button className={styles.backToSplashButton}>
                        Back to Msgs
                    </button>
                </Link>
            </div>
        </div>
    );
}