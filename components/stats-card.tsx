'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    gradient?: string
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    gradient,
}: StatsCardProps) {
    return (
        <Card className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
            {/* HEADER FULL GRADIENT */}
            <div
                className={cn(
                    'bg-gradient-to-r p-4 text-white',
                    gradient
                )}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>

                    <div className="rounded-xl bg-white/20 p-2">
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>

            {/* BODY */}
            <CardContent className="p-4">
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
