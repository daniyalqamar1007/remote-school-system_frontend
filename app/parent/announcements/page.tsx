"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudent } from "../context/StudentContext";

interface Announcement {
  _id: string;
  title: string;
  subtitle?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination (optional)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(
      `${process.env.NEXT_PUBLIC_SRS_SERVER}/activity?page=${page}&limit=10&performBy=Admin`
    )
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => {
        setError("Failed to fetch announcements");
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-8">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">School Announcements</h1>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 mr-2 text-blue-500" />
            <span>Loading announcements...</span>
          </div>
        ) : error ? (
          <div className="flex items-center text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-gray-500 text-center py-16">
            No announcements found.
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((item) => (
              <Card key={item._id} className="shadow hover:shadow-lg transition">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Badge variant="secondary" className="mb-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Badge>
                  <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{item.subtitle || <span className="italic text-gray-400">No description</span>}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              className="px-3 py-1 rounded bg-blue-50 text-blue-600 font-semibold disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-blue-50 text-blue-600 font-semibold disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}