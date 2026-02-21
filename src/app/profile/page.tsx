"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CompanyProfile, CaseStudy } from "@/types";
import { saveCompanyProfile, getCompanyProfile } from "@/lib/storage";
import {
  Building2,
  Shield,
  Cpu,
  Briefcase,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Check,
  Upload,
  Loader2,
} from "lucide-react";
import { showToast } from "@/components/Toast";

const emptyProfile: CompanyProfile = {
  id: "default",
  name: "",
  industry: "",
  size: "",
  description: "",
  certifications: [],
  technologies: [],
  caseStudies: [],
  updatedAt: "",
};

const emptyCaseStudy: CaseStudy = {
  id: "",
  title: "",
  client: "",
  description: "",
  outcome: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile>(emptyProfile);
  const [certInput, setCertInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    const existing = getCompanyProfile();
    if (existing) setProfile(existing);
  }, []);

  const parseCompanyDoc = async (file: File) => {
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-company-doc", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }
      const data = await res.json();
      setProfile((p) => ({
        ...p,
        name: data.companyName || p.name,
        industry: data.industry || p.industry,
        size: data.employeeCount?.toString() || p.size,
        description: data.description || p.description,
        certifications: data.certifications?.length
          ? [...new Set([...p.certifications, ...data.certifications])]
          : p.certifications,
        technologies: data.technologies?.length
          ? [...new Set([...p.technologies, ...data.technologies])]
          : p.technologies,
      }));
      showToast("success", "Company info extracted and applied!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to parse company document");
    } finally {
      setIsParsing(false);
    }
  };

  const updateField = (field: keyof CompanyProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const addCertification = () => {
    const trimmed = certInput.trim();
    if (trimmed && !profile.certifications.includes(trimmed)) {
      setProfile((p) => ({ ...p, certifications: [...p.certifications, trimmed] }));
      setCertInput("");
    }
  };

  const removeCertification = (cert: string) => {
    setProfile((p) => ({
      ...p,
      certifications: p.certifications.filter((c) => c !== cert),
    }));
  };

  const addTechnology = () => {
    const trimmed = techInput.trim();
    if (trimmed && !profile.technologies.includes(trimmed)) {
      setProfile((p) => ({ ...p, technologies: [...p.technologies, trimmed] }));
      setTechInput("");
    }
  };

  const removeTechnology = (tech: string) => {
    setProfile((p) => ({
      ...p,
      technologies: p.technologies.filter((t) => t !== tech),
    }));
  };

  const addCaseStudy = () => {
    setProfile((p) => ({
      ...p,
      caseStudies: [
        ...p.caseStudies,
        { ...emptyCaseStudy, id: crypto.randomUUID() },
      ],
    }));
  };

  const updateCaseStudy = (id: string, field: keyof CaseStudy, value: string) => {
    setProfile((p) => ({
      ...p,
      caseStudies: p.caseStudies.map((cs) =>
        cs.id === id ? { ...cs, [field]: value } : cs
      ),
    }));
  };

  const removeCaseStudy = (id: string) => {
    setProfile((p) => ({
      ...p,
      caseStudies: p.caseStudies.filter((cs) => cs.id !== id),
    }));
  };

  const handleSave = () => {
    saveCompanyProfile({ ...profile, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors";

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to BidCraft
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
          <p className="text-white/40 text-sm">
            This information helps BidCraft generate tailored, accurate RFP responses.
          </p>
        </div>

        {/* Auto-fill from document */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Auto-Fill from Document</h2>
              <p className="text-xs text-white/30">Upload a capability statement, about page, or marketing doc</p>
            </div>
          </div>
          <label
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isParsing
                ? "border-cyan-500/30 bg-cyan-500/[0.04]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            }`}
          >
            {isParsing ? (
              <>
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-sm text-cyan-300">Analyzing document...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-white/30" />
                <span className="text-sm text-white/40">
                  Drop or click to upload (PDF, DOCX, TXT)
                </span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              disabled={isParsing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseCompanyDoc(file);
                e.target.value = "";
              }}
            />
          </label>
        </section>

        {/* Company Info */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold">Company Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Company Name</label>
              <input
                className={inputClass}
                placeholder="Acme Corporation"
                value={profile.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Industry</label>
                <input
                  className={inputClass}
                  placeholder="Information Technology"
                  value={profile.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Company Size</label>
                <select
                  className={inputClass}
                  value={profile.size}
                  onChange={(e) => updateField("size", e.target.value)}
                >
                  <option value="" className="bg-[#0B0F1A]">Select size</option>
                  <option value="1-10" className="bg-[#0B0F1A]">1-10 employees</option>
                  <option value="11-50" className="bg-[#0B0F1A]">11-50 employees</option>
                  <option value="51-200" className="bg-[#0B0F1A]">51-200 employees</option>
                  <option value="201-1000" className="bg-[#0B0F1A]">201-1,000 employees</option>
                  <option value="1000+" className="bg-[#0B0F1A]">1,000+ employees</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Company Description</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-none`}
                placeholder="Describe your company's core competencies, services, and value proposition..."
                value={profile.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold">Certifications & Compliance</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className={`${inputClass} flex-1`}
              placeholder="e.g., ISO 27001, SOC 2, FedRAMP"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCertification()}
            />
            <button
              onClick={addCertification}
              className="px-4 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4 text-white/50" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300"
              >
                {cert}
                <button onClick={() => removeCertification(cert)} className="text-cyan-400/50 hover:text-cyan-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
            {profile.certifications.length === 0 && (
              <span className="text-xs text-white/20">No certifications added yet</span>
            )}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold">Technology Stack</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className={`${inputClass} flex-1`}
              placeholder="e.g., AWS, React, Python, Kubernetes"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTechnology()}
            />
            <button
              onClick={addTechnology}
              className="px-4 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4 text-white/50" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.technologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
              >
                {tech}
                <button onClick={() => removeTechnology(tech)} className="text-amber-400/50 hover:text-amber-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
            {profile.technologies.length === 0 && (
              <span className="text-xs text-white/20">No technologies added yet</span>
            )}
          </div>
        </section>

        {/* Case Studies */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">Past Projects & Case Studies</h2>
          </div>
          <div className="space-y-4">
            {profile.caseStudies.map((cs) => (
              <div
                key={cs.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <input
                    className={`${inputClass} flex-1 mr-3`}
                    placeholder="Project title"
                    value={cs.title}
                    onChange={(e) => updateCaseStudy(cs.id, "title", e.target.value)}
                  />
                  <button
                    onClick={() => removeCaseStudy(cs.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  className={inputClass}
                  placeholder="Client name"
                  value={cs.client}
                  onChange={(e) => updateCaseStudy(cs.id, "client", e.target.value)}
                />
                <textarea
                  className={`${inputClass} min-h-[80px] resize-none`}
                  placeholder="Describe the project scope, your role, and approach..."
                  value={cs.description}
                  onChange={(e) => updateCaseStudy(cs.id, "description", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Key outcome or metric (e.g., 40% cost reduction)"
                  value={cs.outcome}
                  onChange={(e) => updateCaseStudy(cs.id, "outcome", e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            onClick={addCaseStudy}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/[0.1] text-sm text-white/40 hover:text-white/60 hover:border-white/[0.2] transition-colors w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Case Study
          </button>
        </section>

        {/* Bottom save */}
        <div className="flex justify-end pt-6 border-t border-white/[0.06]">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-sm font-medium transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
