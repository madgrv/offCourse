'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useProfile, UserProfile, UserGoals } from '@/app/context/profile-context';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, goals, loading, error, updateProfile, updateGoals } = useProfile();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  
  // Personal information state
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [goal, setGoal] = useState('');
  
  // Nutrition goals state
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [carbGoal, setCarbGoal] = useState('');
  const [fatGoal, setFatGoal] = useState('');
  const [planDuration, setPlanDuration] = useState('');

  // Update local state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeight(profile.height?.toString() || '');
      setWeight(profile.weight?.toString() || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setActivityLevel(profile.activity_level || '');
      setDietaryRestrictions(profile.dietary_restrictions || '');
      setGoal(profile.goal || '');
    }

    if (goals) {
      setCalorieGoal(goals.calorie_goal?.toString() || '');
      setProteinGoal(goals.protein_goal?.toString() || '');
      setCarbGoal(goals.carb_goal?.toString() || '');
      setFatGoal(goals.fat_goal?.toString() || '');
      setPlanDuration(goals.plan_duration?.toString() || '');
    }
  }, [profile, goals]);

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const profileData: Partial<UserProfile> = {
        display_name: displayName,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        age: age ? parseInt(age) : undefined,
        gender,
        activity_level: activityLevel,
        dietary_restrictions: dietaryRestrictions,
        goal,
      };

      await updateProfile(profileData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle goals form submission
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const goalData: Partial<UserGoals> = {
        calorie_goal: calorieGoal ? parseInt(calorieGoal) : undefined,
        protein_goal: proteinGoal ? parseInt(proteinGoal) : undefined,
        carb_goal: carbGoal ? parseInt(carbGoal) : undefined,
        fat_goal: fatGoal ? parseInt(fatGoal) : undefined,
        plan_duration: planDuration ? parseInt(planDuration) : undefined,
      };

      await updateGoals(goalData);
      alert('Nutrition goals updated successfully');
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to update nutrition goals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-4xl font-bold mb-6">Your Profile</h1>
          <p className="text-lg mb-8">Manage your personal information and preferences</p>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg">Loading profile data...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/20 p-4 rounded-md mb-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Tabs defaultValue="personal" onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="goals">Nutrition Goals</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input 
                            id="displayName"
                            placeholder="Your display name" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input 
                            id="age"
                            type="number" 
                            placeholder="Your age" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input 
                            id="height"
                            type="number" 
                            placeholder="Your height in centimetres" 
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Enter your height in centimetres</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input 
                            id="weight"
                            type="number" 
                            placeholder="Your weight in kilograms" 
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Enter your weight in kilograms</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female">Female</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other">Other</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label>Activity Level</Label>
                          <RadioGroup value={activityLevel} onValueChange={setActivityLevel} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sedentary" id="sedentary" />
                              <Label htmlFor="sedentary">Sedentary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="light" id="light" />
                              <Label htmlFor="light">Light Activity</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="moderate" id="moderate" />
                              <Label htmlFor="moderate">Moderate Activity</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="active" id="active" />
                              <Label htmlFor="active">Very Active</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="goal">Fitness Goal</Label>
                          <Input 
                            id="goal"
                            placeholder="Your fitness goal" 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">For example: lose weight, gain muscle, maintain fitness</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                          <Input 
                            id="dietaryRestrictions"
                            placeholder="Any dietary restrictions or preferences" 
                            value={dietaryRestrictions}
                            onChange={(e) => setDietaryRestrictions(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">For example: vegetarian, vegan, gluten-free, dairy-free</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals">
                <Card>
                  <CardHeader>
                    <CardTitle>Nutrition Goals</CardTitle>
                    <CardDescription>Set your nutrition and fitness targets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGoalSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="calorieGoal">Daily Calorie Goal</Label>
                          <Input 
                            id="calorieGoal"
                            type="number" 
                            placeholder="2000" 
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Target daily calorie intake</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="proteinGoal">Daily Protein Goal (g)</Label>
                          <Input 
                            id="proteinGoal"
                            type="number" 
                            placeholder="150" 
                            value={proteinGoal}
                            onChange={(e) => setProteinGoal(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Target daily protein intake in grams</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="carbGoal">Daily Carbohydrate Goal (g)</Label>
                          <Input 
                            id="carbGoal"
                            type="number" 
                            placeholder="200" 
                            value={carbGoal}
                            onChange={(e) => setCarbGoal(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Target daily carbohydrate intake in grams</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fatGoal">Daily Fat Goal (g)</Label>
                          <Input 
                            id="fatGoal"
                            type="number" 
                            placeholder="65" 
                            value={fatGoal}
                            onChange={(e) => setFatGoal(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Target daily fat intake in grams</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="planDuration">Plan Duration (days)</Label>
                          <Input 
                            id="planDuration"
                            type="number" 
                            placeholder="30" 
                            value={planDuration}
                            onChange={(e) => setPlanDuration(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">Duration of your nutrition plan in days</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Goals'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Email Address</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <h3 className="text-lg font-medium">Password</h3>
                        <p className="text-sm text-muted-foreground mb-4">Change your password to keep your account secure</p>
                        <Button variant="outline">Change Password</Button>
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <h3 className="text-lg font-medium">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all of your data</p>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
