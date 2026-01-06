import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from "../App";
import { supabase } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Save, Lock, User, Palette, Eye, EyeOff, Upload, X } from "lucide-react";

const ProfilePage = ({ user: initialUser, setUser: setAppUser }) => {
    const { theme, setTheme } = useContext(ThemeContext);
    const [user, setUser] = useState(initialUser || {});
    const [loading, setLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Form States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showProfileSaveConfirm, setShowProfileSaveConfirm] = useState(false);
    const [showPasswordSaveConfirm, setShowPasswordSaveConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Feedback
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            setFirstName(initialUser.first_name || '');
            setLastName(initialUser.last_name || '');
            setEmail(initialUser.email || '');
            setAvatarUrl(initialUser.avatar_url || '');
        }
    }, [initialUser]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showMessage('error', 'Invalid file type. Use JPEG or PNG.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'File size exceeds 2MB.');
            return;
        }

        try {
            setAvatarUploading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result;
                // Only update preview, not global state
                setAvatarUrl(base64Data);

                // Save to DB
                const { error } = await supabase
                    .from('users')
                    .update({ avatar_url: base64Data })
                    .eq('id', user.id);

                if (error) throw error;
                
                // Update global state only after successful save
                const updatedUser = { ...user, avatar_url: base64Data };
                setUser(updatedUser);
                if (setAppUser) setAppUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                setSuccessMessage('Profile picture updated successfully!');
                setShowSuccessModal(true);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            showMessage('error', 'Failed to update profile picture.');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            setShowProfileSaveConfirm(false);
            
            if (!firstName.trim() || !lastName.trim()) {
                showMessage('error', 'First and Last name are required.');
                setLoading(false);
                return;
            }

            const updates = {
                first_name: firstName,
                last_name: lastName,
                email: email,
            };

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Preserve all existing user fields including avatar_url
            const updatedUser = { 
                ...user, 
                ...updates,
                firstName: firstName,  // camelCase for compatibility
                lastName: lastName     // camelCase for compatibility
            };
            setUser(updatedUser);
            if (setAppUser) setAppUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setSuccessMessage('Profile updated successfully!');
            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);
            showMessage('error', 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            setLoading(true);
            setShowPasswordSaveConfirm(false);
            
            if (newPassword !== confirmPassword) {
                showMessage('error', 'New passwords do not match.');
                setLoading(false);
                return;
            }
            if (newPassword.length < 6) {
                showMessage('error', 'Password must be at least 6 characters.');
                setLoading(false);
                return;
            }

            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('password')
                .eq('id', user.id)
                .single();

            if (fetchError || !userData) throw new Error("Failed to verify account.");

            if (userData.password !== currentPassword) {
                showMessage('error', 'Incorrect current password.');
                setLoading(false);
                return;
            }

            const { error: updateError } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSuccessMessage('Password changed successfully!');
            setShowSuccessModal(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err) {
            console.error(err);
            showMessage('error', err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const getUserInitials = () => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
        return 'U';
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Profile & Settings</h1>
                    <p className="text-muted-foreground">Manage your account details and preferences.</p>
                </div>

                {/* Global Alert Message */}
                {message.text && (
                    <div className={`p-4 rounded-md mb-4 ${message.type === 'error' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>
                        {message.type === 'error' ? <i className="fas fa-exclamation-circle mr-2" /> : <i className="fas fa-check-circle mr-2" />}
                        {message.text}
                    </div>
                )}

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <User className="w-4 h-4" /> General
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Security
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Appearance
                        </TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general">
                        <div className="grid gap-6">

                            {/* Profile Picture Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Picture</CardTitle>
                                    <CardDescription>Click the image to view full size, or the upload button to change.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <div className="relative group">
                                        {/* Avatar Display */}
                                        <div
                                            className="cursor-pointer transition-transform active:scale-95"
                                            onClick={() => setShowImageModal(true)}
                                            title="View Full Image"
                                        >
                                            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                                <AvatarImage src={avatarUrl} className="object-cover" />
                                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                                    {getUserInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Upload Button */}
                                        <button
                                            onClick={handleAvatarClick}
                                            className="
        absolute bottom-0 right-0
        bg-[var(--card)]
        text-[var(--card-foreground)]
        p-3 rounded-full
        shadow-lg
        hover:bg-[var(--muted)]
        transition-all
        border-4 border-background
    "
                                        >
                                            <Upload className="w-5 h-5" />
                                        </button>


                                        {/* Upload Loading Indicator */}
                                        {avatarUploading && (
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center pointer-events-none">
                                                <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-muted-foreground mt-6">Allowed: JPEG, PNG • Max size: 2MB</p>
                                </CardContent>
                            </Card>

                            {/* Image Zoom Modal */}
                            {showImageModal && (
                                <div
                                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                                    onClick={() => setShowImageModal(false)}
                                >
                                    <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                                        <button
                                            onClick={() => setShowImageModal(false)}
                                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                        <img
                                            src={avatarUrl || '/placeholder-avatar.png'}
                                            alt="Profile"
                                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Personal Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-6">
                                    <Button onClick={() => setShowProfileSaveConfirm(true)} disabled={loading}>
                                        {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </Card>

                        </div>
                    </TabsContent>

                    {/* SECURITY TAB */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Ensure your account is secure by using a strong password.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end border-t pt-6">
                                <Button onClick={() => setShowPasswordSaveConfirm(true)} disabled={loading}>
                                    {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* APPEARANCE TAB */}
                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>Theme Preferences</CardTitle>
                                <CardDescription>Customize the look and feel of the application.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                                    <div className="flex items-center gap-4">
                                        {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                        <div>
                                            <p className="font-medium">Theme Mode</p>
                                            <p className="text-sm text-muted-foreground">Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={theme === 'light' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTheme('light')}
                                            className="gap-2"
                                        >
                                            <Sun className="w-4 h-4" /> Light
                                        </Button>
                                        <Button
                                            variant={theme === 'dark' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setTheme('dark')}
                                            className="gap-2"
                                        >
                                            <Moon className="w-4 h-4" /> Dark
                                        </Button>
                                    </div>
                                </div>

                                {/* Theme Preview */}
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 rounded-lg bg-muted/20 border">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
                                        <div className="space-y-2">
                                            <div className="h-8 bg-primary rounded w-3/4"></div>
                                            <div className="h-4 bg-secondary rounded w-1/2"></div>
                                            <div className="h-4 bg-secondary/50 rounded w-full"></div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/20 border">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">COLORS</p>
                                        <div className="flex gap-2">
                                            <div className="h-6 w-6 bg-primary rounded"></div>
                                            <div className="h-6 w-6 bg-secondary rounded"></div>
                                            <div className="h-6 w-6 bg-accent rounded"></div>
                                            <div className="h-6 w-6 bg-destructive rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>

            {/* Profile Save Confirmation Modal */}
            {showProfileSaveConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-sm p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold mb-2">Confirm Profile Update</h3>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to save these changes to your profile?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowProfileSaveConfirm(false)}
                                className="px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateProfile}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors text-sm font-medium"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Confirmation Modal */}
            {showPasswordSaveConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-sm p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold mb-2">Confirm Password Change</h3>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to change your password? You will need to use the new password for your next login.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowPasswordSaveConfirm(false)}
                                className="px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors text-sm font-medium"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2" />
                                        Updating...
                                    </>
                                ) : (
                                    'Change Password'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Confirmation Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-sm p-6 border border-border animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <i className="fas fa-check-circle text-green-500 text-3xl"></i>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Success!</h3>
                            <p className="text-muted-foreground mb-6">
                                {successMessage}
                            </p>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors text-sm font-medium"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
