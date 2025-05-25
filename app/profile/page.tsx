'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import {
  useProfile,
  UserProfile,
  UserGoals,
} from '@/app/context/profile-context';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import en from '@/shared/language/en';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, goals, loading, error, updateProfile, updateGoals } =
    useProfile();
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
      alert(en.profile.saveSuccess);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(en.profile.saveError);
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
      alert(en.profile.saveSuccess);
    } catch (error) {
      console.error('Error saving goals:', error);
      alert(en.profile.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto md:py-10 py-2 px-2'>
          <h1 className='text-4xl font-bold mb-6'>{en.profile.title}</h1>
          <p className='text-lg mb-8'>{en.profile.description}</p>

          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <p className='text-lg'>{en.loading}</p>
            </div>
          ) : error ? (
            <div className='bg-destructive/20 p-4 rounded-md mb-8'>
              <p className='text-destructive'>{error}</p>
            </div>
          ) : (
            <Tabs defaultValue='personal' onValueChange={setActiveTab}>
              <TabsList className='flex-nowrap overflow-x-auto scrollbar-none w-full mb-2'>
                <TabsTrigger value='personal'>
                  {en.profile.personalInfo}
                </TabsTrigger>
                <TabsTrigger value='goals'>
                  {en.profile.nutritionGoals}
                </TabsTrigger>
                <TabsTrigger value='account'>
                  {en.profile.accountSettings}
                </TabsTrigger>
              </TabsList>

              <TabsContent value='personal'>
                <Card>
                  <CardHeader>
                    <CardTitle>{en.profile.personalInfo}</CardTitle>
                    <CardDescription>
                      {en.profile.personalInfoDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className='space-y-6'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                          <Label htmlFor='displayName'>
                            {en.profile.displayName}
                          </Label>
                          <Input
                            id='displayName'
                            placeholder={en.profile.displayNamePlaceholder}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='age'>{en.profile.age}</Label>
                          <Input
                            id='age'
                            type='number'
                            placeholder={en.profile.agePlaceholder}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='height'>{en.profile.height}</Label>
                          <Input
                            id='height'
                            type='number'
                            placeholder={en.profile.heightPlaceholder}
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.heightDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='weight'>{en.profile.weight}</Label>
                          <Input
                            id='weight'
                            type='number'
                            placeholder={en.profile.weightPlaceholder}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.weightDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label>{en.profile.gender}</Label>
                          <RadioGroup
                            value={gender}
                            onValueChange={setGender}
                            className='flex space-x-4'
                          >
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='male' id='male' />
                              <Label htmlFor='male'>{en.profile.male}</Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='female' id='female' />
                              <Label htmlFor='female'>
                                {en.profile.female}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='other' id='other' />
                              <Label htmlFor='other'>{en.profile.other}</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className='space-y-2'>
                          <Label>{en.profile.activityLevel}</Label>
                          <RadioGroup
                            value={activityLevel}
                            onValueChange={setActivityLevel}
                            className='space-y-2'
                          >
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem
                                value='sedentary'
                                id='sedentary'
                              />
                              <Label htmlFor='sedentary'>
                                {en.profile.sedentary}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='light' id='light' />
                              <Label htmlFor='light'>
                                {en.profile.lightlyActive}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='moderate' id='moderate' />
                              <Label htmlFor='moderate'>
                                {en.profile.moderatelyActive}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='active' id='active' />
                              <Label htmlFor='active'>
                                {en.profile.veryActive}
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='goal'>{en.profile.fitnessGoal}</Label>
                          <Input
                            id='goal'
                            placeholder={en.profile.fitnessGoalPlaceholder}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.fitnessGoalPlaceholder}
                          </p>
                        </div>

                        <div className='space-y-2 md:col-span-2'>
                          <Label htmlFor='dietaryRestrictions'>
                            {en.profile.dietaryRestrictions}
                          </Label>
                          <Input
                            id='dietaryRestrictions'
                            placeholder={
                              en.profile.dietaryRestrictionsPlaceholder
                            }
                            value={dietaryRestrictions}
                            onChange={(e) =>
                              setDietaryRestrictions(e.target.value)
                            }
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.dietaryRestrictionsDesc}
                          </p>
                        </div>
                      </div>

                      <div className='pt-4 border-t'>
                        <Button type='submit' disabled={isSaving}>
                          {isSaving
                            ? en.profile.saving
                            : en.profile.saveChanges}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='goals'>
                <Card>
                  <CardHeader>
                    <CardTitle>{en.profile.nutritionGoals}</CardTitle>
                    <CardDescription>
                      {en.profile.nutritionGoalsDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGoalSubmit} className='space-y-6'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                          <Label htmlFor='calorieGoal'>
                            {en.profile.calorieGoal}
                          </Label>
                          <Input
                            id='calorieGoal'
                            type='number'
                            placeholder='2000'
                            value={calorieGoal}
                            onChange={(e) => setCalorieGoal(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.calorieGoalDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='proteinGoal'>
                            {en.profile.proteinGoal}
                          </Label>
                          <Input
                            id='proteinGoal'
                            type='number'
                            placeholder='150'
                            value={proteinGoal}
                            onChange={(e) => setProteinGoal(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.proteinGoalDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='carbGoal'>
                            {en.profile.carbGoal}
                          </Label>
                          <Input
                            id='carbGoal'
                            type='number'
                            placeholder='200'
                            value={carbGoal}
                            onChange={(e) => setCarbGoal(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.carbGoalDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='fatGoal'>{en.profile.fatGoal}</Label>
                          <Input
                            id='fatGoal'
                            type='number'
                            placeholder='65'
                            value={fatGoal}
                            onChange={(e) => setFatGoal(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.fatGoalDesc}
                          </p>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='planDuration'>
                            {en.profile.planDuration}
                          </Label>
                          <Input
                            id='planDuration'
                            type='number'
                            placeholder='30'
                            value={planDuration}
                            onChange={(e) => setPlanDuration(e.target.value)}
                          />
                          <p className='text-sm text-muted-foreground'>
                            {en.profile.planDurationDesc}
                          </p>
                        </div>
                      </div>

                      <div className='pt-4 border-t'>
                        <Button type='submit' disabled={isSaving}>
                          {isSaving
                            ? en.profile.saving
                            : en.profile.saveChanges}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='account'>
                <Card>
                  <CardHeader>
                    <CardTitle>{en.profile.accountSettings}</CardTitle>
                    <CardDescription>
                      {en.profile.accountSettingsDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-lg font-medium'>
                          {en.profile.email}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {user?.email}
                        </p>
                      </div>

                      <Separator className='my-4' />

                      <div>
                        <h3 className='text-lg font-medium'>
                          {en.profile.password}
                        </h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          {en.profile.passwordDesc}
                        </p>
                        <Button variant='outline'>
                          {en.profile.changePassword}
                        </Button>
                      </div>

                      <Separator className='my-4' />

                      <div>
                        <h3 className='text-lg font-medium'>
                          {en.profile.dangerZone}
                        </h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          {en.profile.dangerZoneDesc}
                        </p>
                        <Button variant='destructive'>
                          {en.profile.deleteAccount}
                        </Button>
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
