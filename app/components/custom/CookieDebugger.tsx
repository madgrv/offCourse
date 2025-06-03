'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';

export default function CookieDebugger() {
  const [cookies, setCookies] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    // Parse all cookies into an object
    const cookieObj: {[key: string]: string} = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) cookieObj[name] = value || '';
    });
    setCookies(cookieObj);
  }, []);
  
  const clearCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Update the state
    setCookies(prev => {
      const newCookies = {...prev};
      delete newCookies[name];
      return newCookies;
    });
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-md mb-4">
      <h3 className="text-lg font-medium mb-2">Cookie Debugger</h3>
      {Object.keys(cookies).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(cookies).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between bg-white p-2 rounded">
              <div>
                <span className="font-medium">{name}:</span> {value}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => clearCookie(name)}
              >
                Clear
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p>No cookies found</p>
      )}
    </div>
  );
}
