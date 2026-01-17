import React, { useState } from 'react';

interface Tier {
    id: string;
    name: string;
    price: number;
    priceYearly: number;
    features: string[];
    popular?: boolean;
}

const tiers: Tier[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        priceYearly: 0,
        features: [
            '10 workflows',
            '100 executions/day',
            '3 retries per node',
            '100 RAG docs/month',
            '10 AI generations/month',
            'Community support'
        ]
    },
    {
        id: 'supporter',
        name: 'Supporter',
        price: 50000,
        priceYearly: 500000,
        popular: true,
        features: [
            '50 workflows',
            '1,000 executions/day',
            '10 retries per node',
            '1,000 RAG docs/month',
            '100 AI generations/month',
            'Advanced scheduling',
            'Priority support',
            'Name in README'
        ]
    },
    {
        id: 'backer',
        name: 'Backer',
        price: 200000,
        priceYearly: 2000000,
        features: [
            'Unlimited workflows',
            'Unlimited executions',
            '50 retries per node',
            'Unlimited RAG docs',
            'Unlimited AI generations',
            'Custom AI models',
            'Logo on website',
            'Direct support channel'
        ]
    },
    {
        id: 'organization',
        name: 'Organization',
        price: 1000000,
        priceYearly: 10000000,
        features: [
            'Everything in Backer',
            'Unlimited retries',
            'Custom connector development',
            'Enterprise support',
            'SLA guarantee',
            'On-premise assistance',
            'Co-branding opportunities'
        ]
    }
];

interface DonationPanelProps {
    currentTier?: string;
    onDonate?: (tier: string, method: string) => void;
}

const DonationPanel: React.FC<DonationPanelProps> = ({
    currentTier = 'free',
    onDonate
}) => {
    const [selectedTier, setSelectedTier] = useState<string>('supporter');
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [showPaymentMethods, setShowPaymentMethods] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const handleDonate = (method: string) => {
        if (onDonate) {
            onDonate(selectedTier, method);
        }
        // In real implementation, redirect to payment
        const paymentUrls: Record<string, string> = {
            trakteer: 'https://trakteer.id/flowwave',
            github: 'https://github.com/sponsors/flowwave',
            saweria: 'https://saweria.co/flowwave'
        };
        const url = paymentUrls[method];
        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="bg-slate-900 text-white p-8 rounded-2xl max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">
                    <span className="text-4xl mr-2">🌊</span>
                    Support FlowWave
                </h2>
                <p className="text-slate-400">
                    Keep FlowWave 100% free & open source by supporting development
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-800 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-4 py-2 rounded-md transition-colors ${billingPeriod === 'monthly'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-4 py-2 rounded-md transition-colors ${billingPeriod === 'yearly'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Yearly <span className="text-green-400 text-sm ml-1">-17%</span>
                    </button>
                </div>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {tiers.map((tier) => {
                    const price = billingPeriod === 'monthly' ? tier.price : tier.priceYearly / 12;
                    const isSelected = selectedTier === tier.id;
                    const isCurrent = currentTier === tier.id;

                    return (
                        <div
                            key={tier.id}
                            onClick={() => tier.id !== 'free' && setSelectedTier(tier.id)}
                            className={`
                                relative p-6 rounded-xl cursor-pointer transition-all
                                ${isSelected
                                    ? 'bg-blue-600 ring-2 ring-blue-400 scale-105'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                }
                                ${tier.id === 'free' ? 'opacity-75 cursor-default' : ''}
                            `}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                                        POPULAR
                                    </span>
                                </div>
                            )}

                            {isCurrent && (
                                <div className="absolute -top-3 right-4">
                                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        CURRENT
                                    </span>
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{tier.name}</h3>

                            <div className="mb-4">
                                <span className="text-3xl font-bold">
                                    {tier.price === 0 ? 'Free' : formatPrice(price)}
                                </span>
                                {tier.price > 0 && (
                                    <span className="text-slate-400 text-sm">/month</span>
                                )}
                            </div>

                            <ul className="space-y-2 text-sm">
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Payment Methods */}
            {selectedTier !== 'free' && (
                <div className="bg-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                        Choose Payment Method
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => handleDonate('trakteer')}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-3xl">☕</span>
                            <span className="text-sm">Trakteer</span>
                        </button>

                        <button
                            onClick={() => handleDonate('saweria')}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-3xl">🎁</span>
                            <span className="text-sm">Saweria</span>
                        </button>

                        <button
                            onClick={() => handleDonate('github')}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-3xl">🐙</span>
                            <span className="text-sm">GitHub Sponsors</span>
                        </button>

                        <button
                            onClick={() => handleDonate('bank')}
                            className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <span className="text-3xl">🏦</span>
                            <span className="text-sm">Bank Transfer</span>
                        </button>
                    </div>

                    <div className="mt-4 text-center text-slate-400 text-sm">
                        <p>Also supports: OVO, GoPay, Dana, QRIS</p>
                    </div>
                </div>
            )}

            {/* Footer Note */}
            <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm">
                    ❤️ All core features remain <strong>100% free forever</strong>
                </p>
                <p className="text-slate-600 text-xs mt-1">
                    Your support helps maintain and improve FlowWave
                </p>
            </div>
        </div>
    );
};

export default DonationPanel;
