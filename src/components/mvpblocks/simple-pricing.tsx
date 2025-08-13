'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, Check, Star, Zap } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Star,
    price: {
      monthly: 29,
      yearly: 24,
    },
    description:
      'Perfect for individuals and small businesses starting their AEO journey.',
    features: [
      'Up to 100 URL submissions/month',
      'Basic AEO scoring & analysis',
      'Lighthouse performance metrics',
      'Email notifications',
      'Basic support',
      '7-day result history',
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    price: {
      monthly: 99,
      yearly: 79,
    },
    description: 'Everything you need to scale your AI search optimization.',
    features: [
      'Unlimited URL submissions',
      'Advanced AEO scoring & insights',
      'Comprehensive Lighthouse metrics',
      'Real-time webhook monitoring',
      'Priority support',
      'Unlimited result history',
      'Custom automation workflows',
      'Team collaboration',
    ],
    cta: 'Get Pro Plan',
    popular: true,
  },
];

export default function SimplePricing() {
  const [frequency, setFrequency] = useState<string>('monthly');

  return (
    <div className="not-prose relative flex w-full flex-col gap-16 overflow-hidden px-4 py-24 text-center sm:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full blur-3xl"></div>
        <div className="bg-primary/5 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-3xl"></div>
        <div className="bg-primary/5 absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-3xl"></div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center space-y-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 mb-4 rounded-full px-4 py-1 text-sm font-medium"
          >
            <Sparkles className="text-primary mr-1 h-3.5 w-3.5 animate-pulse" />
            Pricing Plans
          </Badge>
          <h1 className="from-foreground to-foreground/30 bg-gradient-to-b bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
            Choose your AEO optimization plan
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Start optimizing your content for AI search engines today with our flexible pricing plans.
          </p>
        </div>

        {/* Frequency Toggle */}
        <div className="flex items-center space-x-2 rounded-lg bg-muted p-1">
          <Tabs value={frequency} onValueChange={setFrequency} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              <Card
                className={cn(
                  'relative h-full transition-all duration-300 hover:shadow-lg',
                  plan.popular
                    ? 'border-primary/20 shadow-primary/10 shadow-lg'
                    : 'hover:border-primary/10',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        plan.popular
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-foreground',
                      )}
                    >
                      <plan.icon className="h-4 w-4" />
                    </div>
                    <CardTitle
                      className={cn(
                        'text-xl font-bold',
                        plan.popular && 'text-primary',
                      )}
                    >
                      {plan.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-3 space-y-2">
                    <p className="text-sm">{plan.description}</p>
                    <div className="pt-2">
                      <div className="flex items-baseline">
                        <span
                          className={cn(
                            'text-3xl font-bold',
                            plan.popular ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          ${plan.price[
                            frequency as keyof typeof plan.price
                          ] as number}
                        </span>
                        <span className="text-muted-foreground ml-1 text-sm">
                          /month, billed {frequency}
                        </span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pb-6">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full',
                          plan.popular
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary-foreground',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={
                          plan.popular
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className={cn(
                      'w-full font-medium transition-all duration-300',
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-md'
                        : 'hover:border-primary/30 hover:bg-primary/5 hover:text-primary',
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </CardFooter>

                {/* Subtle gradient effects */}
                {plan.popular ? (
                  <>
                    <div className="from-primary/[0.05] pointer-events-none absolute right-0 bottom-0 left-0 h-1/2 rounded-b-lg bg-gradient-to-t to-transparent" />
                    <div className="border-primary/20 pointer-events-none absolute inset-0 rounded-lg border" />
                  </>
                ) : (
                  <div className="hover:border-primary/10 pointer-events-none absolute inset-0 rounded-lg border border-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
