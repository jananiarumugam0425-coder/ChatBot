import React from 'react';

const AuthForms = ({ 
    username, setUsername, 
    password, setPassword,
    fullName, setFullName, 
    email, setEmail, 
    phoneNumber, setPhoneNumber, 
    country, setCountry, 
    isSignUp, 
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    currentView, setCurrentView,
    VIEW_STATES,
    handleAuth, 
    handleVerifyUsername, 
    handleResetPassword,
    handleToggleAuth,
    title,
    error, message, getMessageClass
}) => {

    /* -------------------------------------------
        --- RENDER FUNCTIONS ---
        ------------------------------------------- */

    const renderAuthForm = () => (
        <form onSubmit={handleAuth} className="login-form" autoComplete="off">
            
            {/* Sign Up Specific Fields */}
            {isSignUp && (
                <>
                    <input type="text" placeholder="Full Name" className="login-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                    <input type="email" placeholder="Email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    <input type="tel" placeholder="Phone Number" className="login-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required autoComplete="tel" />
                    <input type="text" placeholder="Country" className="login-input" value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="country-name" />
                </>
            )}

            {/* Common Fields */}
            <input type="text" placeholder="Username" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} />
            
            {/* Forgot Password Link (Only on Login View) */}
            {!isSignUp && (
                 <button 
                    type="button" 
                    onClick={() => {
                        setPassword(''); 
                        setCurrentView(VIEW_STATES.VERIFY_USERNAME);
                    }} 
                    className="forgot-password-button"
                 >
                    Forgot Password?
                 </button>
            )}
            
            <button 
                type="submit" 
                className="login-button"
            >
                {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            
        </form>
    );

    const renderVerifyUsernameForm = () => (
        <form onSubmit={handleVerifyUsername} className="login-form">
            <p className='login-info'>Enter your **username** to find your account.</p>
            <input
                type="text"
                placeholder="Enter Username"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <button type="submit" className="login-button">
                Verify Username
            </button>
        </form>
    );

    const renderResetPasswordForm = () => (
        <form onSubmit={handleResetPassword} className="login-form">
            <p className='login-info'>Set a new password for user: **{username}**</p>
            <input
                type="password"
                placeholder="New Password (min 6 chars)"
                className="login-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
            />
            <input
                type="password"
                placeholder="Confirm New Password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
            />
            <button 
                type="submit" 
                className="login-button" 
                disabled={!newPassword || newPassword !== confirmPassword || !username.trim()}
            >
                Reset Password
            </button>
        </form>
    );

    // --- MAIN RENDER LOGIC ---

    let currentTitle = title;
    let content;

    switch (currentView) {
        case VIEW_STATES.VERIFY_USERNAME:
            currentTitle = 'Forgot Password';
            content = renderVerifyUsernameForm();
            break;
        case VIEW_STATES.RESET_PASSWORD:
            currentTitle = 'Set New Password';
            content = renderResetPasswordForm();
            break;
        case VIEW_STATES.AUTH:
        default:
            content = renderAuthForm();
            break;
    }


    return (
        <>
            <h2 className="login-title">{currentTitle}</h2>
            
            {/* Message/Error Display */}
            {(message || error) && <div className={getMessageClass()}>{message || error}</div>}
            
            {content}
            
            {/* Toggle Button / Back to Login Button */}
            {currentView === VIEW_STATES.AUTH ? (
                <button
                    onClick={handleToggleAuth}
                    className="toggle-auth-button"
                >
                    {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                </button>
            ) : (
                <button
                    onClick={() => {
                        // Only clear username if we're going from Reset back to Login
                        if (currentView === VIEW_STATES.RESET_PASSWORD) {
                            setUsername(''); 
                        }
                        setCurrentView(VIEW_STATES.AUTH);
                    }}
                    className="toggle-auth-button"
                >
                    &larr; Back to Log In
                </button>
            )}
        </>
    );
};

export default AuthForms;