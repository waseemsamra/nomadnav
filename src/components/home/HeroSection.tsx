
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HeroSection() {
    const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
    return (
        <section className="relative h-[600px] flex items-center justify-center text-white">
            {heroImage && (
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{backgroundImage: `url('${heroImage.imageUrl}')`}}
                    data-ai-hint={heroImage.imageHint}
                >
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            )}
            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    Your Journey, Reimagined
                </h1>
                <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
                    Discover and book flights and hotels with personalized
                    recommendations. Nomad Navigator makes travel planning effortless.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button asChild size="lg" className="px-8">
                        <Link href="/search">Start Your Adventure</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="px-8 bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white/20">
                        <Link href="/dashboard">My Dashboard</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

    