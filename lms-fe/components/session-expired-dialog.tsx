'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export function SessionExpiredDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Listen for session expired events
        const handleSessionExpired = () => {
            setIsOpen(true)
        }

        window.addEventListener('session-expired', handleSessionExpired)

        return () => {
            window.removeEventListener('session-expired', handleSessionExpired)
        }
    }, [])

    const handleLogin = () => {
        setIsOpen(false)
        // Clear any remaining auth data
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        // Redirect to login
        router.push('/login')
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <DialogTitle className="text-xl">Session Expired</DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        Your session has expired for security reasons. Please log in again to continue using the application.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handleLogin}
                        className="w-full sm:w-auto"
                        size="lg"
                    >
                        Log In Again
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Helper function to trigger the session expired dialog
export function triggerSessionExpired() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('session-expired'))
    }
}
