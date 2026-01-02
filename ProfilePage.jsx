import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from "../App";
import { supabase } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Assuming Label exists or use standard label
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Camera, Save, Lock, User, Palette, Eye, EyeOff } from "lucide-react";

const ProfilePage = ({ user: initialUser, setUser: setAppUser }) => {
    // Profile Page Component
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

    // Feedback
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            setFirstName(initialUser.first_name || '');
            setLastName(initialUser.last_name || '');
            setEmail(initialUser.email || '');
            setAvatarUrl(initialUser.avatar_url || ''); // Assuming avatar_url is passed or in local storage
        }
    }, [initialUser]);

    // Helper to show messages (You might want to replace this with the App's toast system if available via props)
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
            showMessage('error', 'Invalid file type use JPEG or PNG.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            showMessage('error', 'File size exceeds 2MB.');
            return;
        }

        try {
            setAvatarUploading(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result;
                setAvatarUrl(base64Data);

                // Optimistic update locally
                const updatedUser = { ...user, avatar_url: base64Data };
                setUser(updatedUser);
                if (setAppUser) setAppUser(updatedUser); // Update App state
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update consistency

                // Save to DB
                const { error } = await supabase
                    .from('users')
                    .update({ avatar_url: base64Data })
                    .eq('id', user.id);

                if (error) throw error;
                showMessage('success', 'Profile picture updated!');
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
            if (!firstName.trim() || !lastName.trim()) {
                showMessage('error', 'First and Last name are required.');
                return;
            }

            const updates = {
                first_name: firstName,
                last_name: lastName,
                email: email, // If allowing email change
            };

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Update local state
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            if (setAppUser) setAppUser(updatedUser); // Update App state
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showMessage('success', 'Profile updated successfully!');

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
            if (newPassword !== confirmPassword) {
                showMessage('error', 'New passwords do not match.');
                return;
            }
            if (newPassword.length < 6) {
                showMessage('error', 'Password must be at least 6 characters.');
                return;
            }

            // Verify current password (if implementing explicitly, usually handled by Supabase Auth but here custom table)
            // Since it's a custom table, we ideally check the current password first. 
            // For now, we'll assume direct update if authorized, but typically you'd verify old password.
            // Skipping verification for simplicity unless requested, to fit implementation blocks.
            // Update: User requested "Change Current Password", implying verification.

            // 1. Check current password
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('password')
                .eq('id', user.id)
                .single();

            if (fetchError || !userData) throw new Error("Failed to verify account.");

            if (userData.password !== currentPassword) {
                showMessage('error', 'Incorrect current password.');
                return;
            }

            // 2. Update password
            const { error: updateError } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', user.id);

            if (updateError) throw updateError;

            showMessage('success', 'Password changed successfully!');
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
                                    <CardDescription>Click on the avatar to upload a new photo.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                        <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                            <AvatarImage src={avatarUrl} className="object-cover" />
                                            <AvatarFallback className="text-4xl bg-primary/10 text-primary">{getUserInitials()}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                        {avatarUploading && (
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                                <i className="fas fa-spinner fa-spin text-white"></i>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-muted-foreground mt-4">Allowed *.jpeg, *.jpg, *.png, max 2MB</p>
                                </CardContent>
                            </Card>

                            {/* Personal Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">First Name</label>
                                            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Last Name</label>
                                            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-6">
                                    <Button onClick={handleUpdateProfile} disabled={loading}>
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
                                    <label className="text-sm font-medium">Current Password</label>
                                    <div className="relative">
                                        <Input
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
                                    <label className="text-sm font-medium">New Password</label>
                                    <div className="relative">
                                        <Input
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
                                    <label className="text-sm font-medium">Confirm New Password</label>
                                    <div className="relative">
                                        <Input
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
                                <Button onClick={handleChangePassword} disabled={loading}>
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
        </div>
    );
};

export default ProfilePage;
