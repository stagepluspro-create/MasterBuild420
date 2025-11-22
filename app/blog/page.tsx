import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const blogPosts = [
  {
    slug: "dmx-addressing-best-practices",
    title: "DMX Addressing Best Practices for Large Tours",
    excerpt: "Learn how to efficiently plan and document DMX addressing for complex touring productions with multiple universes and consoles.",
    category: "Lighting",
    date: "2024-11-15",
    readTime: "8 min read",
  },
  {
    slug: "spl-monitoring-compliance",
    title: "SPL Monitoring and Venue Compliance",
    excerpt: "Understanding sound pressure level regulations and how to monitor your shows to stay compliant with local noise ordinances.",
    category: "Audio",
    date: "2024-11-10",
    readTime: "6 min read",
  },
  {
    slug: "console-file-translation-guide",
    title: "Complete Guide to Console File Translation",
    excerpt: "Everything you need to know about converting showfiles between different lighting console platforms without losing data.",
    category: "Console",
    date: "2024-11-05",
    readTime: "10 min read",
  },
  {
    slug: "production-workflow-optimization",
    title: "Optimizing Your Production Workflow",
    excerpt: "Streamline your pre-production, programming, and show day processes with these proven workflow strategies.",
    category: "Production",
    date: "2024-10-28",
    readTime: "7 min read",
  },
  {
    slug: "rf-coordination-wireless-mics",
    title: "RF Coordination for Wireless Microphones",
    excerpt: "Master the art of frequency coordination for wireless microphone systems in challenging RF environments.",
    category: "Audio",
    date: "2024-10-20",
    readTime: "9 min read",
  },
  {
    slug: "power-distribution-touring",
    title: "Power Distribution Planning for Tours",
    excerpt: "Calculate power requirements, size distros correctly, and ensure electrical safety on the road.",
    category: "Lighting",
    date: "2024-10-12",
    readTime: "11 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            StageTechPro Blog
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Tips, tutorials, and insights for stage, audio, and production professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="glass-panel border-white/10 hover:border-cyan-400/50 transition-all h-full group cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-cyan-400 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-300">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-cyan-400 group-hover:translate-x-2 transition-transform">
                    Read Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400">
            More articles coming soon. Follow us for updates on production techniques and industry insights.
          </p>
        </div>
      </div>
    </div>
  );
}
