"use client";

import React from "react";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

interface ProfileEditorProps {
  data: ResumeProfile;
  onChange: (data: ResumeProfile) => void;
}

export function ProfileEditor({ data, onChange }: ProfileEditorProps) {
  const updateField = (
    section: keyof ResumeProfile,
    field: string,
    value: unknown,
  ) => {
    onChange({
      ...data,
      [section]: {
        ...((data[section] as Record<string, unknown>) || {}),
        [field]: value,
      },
    });
  };

  const updateRootField = (field: keyof ResumeProfile, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const updateArrayItem = (
    section: keyof ResumeProfile,
    index: number,
    field: string,
    value: unknown,
  ) => {
    const list = [...((data[section] as Record<string, unknown>[]) || [])];
    list[index] = { ...list[index], [field]: value };
    onChange({ ...data, [section]: list as never });
  };

  const addArrayItem = (
    section: keyof ResumeProfile,
    initial: Record<string, unknown>,
  ) => {
    const list = [
      ...((data[section] as Record<string, unknown>[]) || []),
      initial,
    ];
    onChange({ ...data, [section]: list as never });
  };

  const removeArrayItem = (section: keyof ResumeProfile, index: number) => {
    const list = [...((data[section] as Record<string, unknown>[]) || [])];
    list.splice(index, 1);
    onChange({ ...data, [section]: list as never });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={data.personalInfo?.name || ""}
              onChange={(e) =>
                updateField("personalInfo", "name", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={data.personalInfo?.email || ""}
              onChange={(e) =>
                updateField("personalInfo", "email", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={data.personalInfo?.phone || ""}
              onChange={(e) =>
                updateField("personalInfo", "phone", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={data.personalInfo?.location?.city || ""}
              onChange={(e) =>
                updateField("personalInfo", "location", {
                  ...data.personalInfo.location,
                  city: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={data.personalInfo?.location?.state || ""}
              onChange={(e) =>
                updateField("personalInfo", "location", {
                  ...data.personalInfo.location,
                  state: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={data.personalInfo?.location?.country || ""}
              onChange={(e) =>
                updateField("personalInfo", "location", {
                  ...data.personalInfo.location,
                  country: e.target.value,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Professional Summary</h3>
        <Textarea
          value={data.summary || ""}
          onChange={(e) => updateRootField("summary", e.target.value)}
          rows={5}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Experience</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem("experience", {
                company: "",
                position: "",
                startDate: "",
                isCurrent: false,
              })
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Experience
          </Button>
        </div>
        {data.experience?.map((exp, idx) => (
          <div
            key={idx}
            className="bg-card/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-0 right-2"
              onClick={() => removeArrayItem("experience", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={exp.company}
                  onChange={(e) =>
                    updateArrayItem(
                      "experience",
                      idx,
                      "company",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={exp.location || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "experience",
                      idx,
                      "location",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={exp.position}
                  onChange={(e) =>
                    updateArrayItem(
                      "experience",
                      idx,
                      "position",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date (YYYY-MM)</Label>
                <Input
                  value={exp.startDate}
                  onChange={(e) =>
                    updateArrayItem(
                      "experience",
                      idx,
                      "startDate",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (YYYY-MM)</Label>
                <Input
                  value={exp.endDate || ""}
                  disabled={exp.isCurrent}
                  onChange={(e) =>
                    updateArrayItem(
                      "experience",
                      idx,
                      "endDate",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exp.isCurrent}
                onChange={(e) =>
                  updateArrayItem(
                    "experience",
                    idx,
                    "isCurrent",
                    e.target.checked,
                  )
                }
                id={`current-${idx}`}
              />
              <Label htmlFor={`current-${idx}`}>I currently work here</Label>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={exp.description || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "experience",
                    idx,
                    "description",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Technologies (comma separated)</Label>
              <Input
                value={(exp.technologies || []).join(", ")}
                onChange={(e) =>
                  updateArrayItem(
                    "experience",
                    idx,
                    "technologies",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Achievements (one per line)</Label>
              <Textarea
                value={(exp.achievements || []).join("\n")}
                onChange={(e) =>
                  updateArrayItem(
                    "experience",
                    idx,
                    "achievements",
                    e.target.value.split("\n").filter(Boolean),
                  )
                }
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Education</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem("education", { degree: "", school: "" })
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        </div>
        {data.education?.map((edu, idx) => (
          <div
            key={idx}
            className="bg-muted/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-0 right-2"
              onClick={() => removeArrayItem("education", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Degree / Course</Label>
                <Input
                  value={edu.degree || ""}
                  onChange={(e) =>
                    updateArrayItem("education", idx, "degree", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>School / College</Label>
                <Input
                  value={edu.school || ""}
                  onChange={(e) =>
                    updateArrayItem("education", idx, "school", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date (YYYY-MM)</Label>
                <Input
                  value={edu.startDate || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "education",
                      idx,
                      "startDate",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (YYYY-MM)</Label>
                <Input
                  value={edu.endDate || ""}
                  onChange={(e) =>
                    updateArrayItem("education", idx, "endDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={edu.location || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "education",
                      idx,
                      "location",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>CGPA or Percentage</Label>
                <Input
                  value={edu.cgpaOrPercentage || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "education",
                      idx,
                      "cgpaOrPercentage",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Projects</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("projects", { title: "" })}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
        {data.projects?.map((proj, idx) => (
          <div
            key={idx}
            className="bg-muted/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-0 right-2"
              onClick={() => removeArrayItem("projects", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={proj.title}
                  onChange={(e) =>
                    updateArrayItem("projects", idx, "title", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Technologies (comma separated)</Label>
                <Input
                  value={(proj.technologies || []).join(", ")}
                  onChange={(e) =>
                    updateArrayItem(
                      "projects",
                      idx,
                      "technologies",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date (YYYY-MM)</Label>
                <Input
                  value={proj.startDate || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "projects",
                      idx,
                      "startDate",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (YYYY-MM)</Label>
                <Input
                  value={proj.endDate || ""}
                  onChange={(e) =>
                    updateArrayItem("projects", idx, "endDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label>Project Links</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const links = [
                      ...(proj.links || []),
                      { type: "github", url: "" },
                    ];
                    updateArrayItem("projects", idx, "links", links);
                  }}
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />{" "}
                  Add Link
                </Button>
              </div>
              {proj.links?.map((link, lIdx) => (
                <div
                  key={lIdx}
                  className="relative grid grid-cols-1 items-center gap-2 pr-8 md:grid-cols-3"
                >
                  <select
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={link.type}
                    onChange={(e) => {
                      const links = [...(proj.links || [])];
                      links[lIdx] = {
                        ...links[lIdx],
                        type: e.target.value as
                          | "github"
                          | "live"
                          | "demo"
                          | "docs"
                          | "other",
                      };
                      updateArrayItem("projects", idx, "links", links);
                    }}
                  >
                    <option value="github">GitHub</option>
                    <option value="live">Live</option>
                    <option value="demo">Demo</option>
                    <option value="docs">Docs</option>
                    <option value="other">Other</option>
                  </select>
                  <Input
                    placeholder="URL"
                    className="md:col-span-2"
                    value={link.url}
                    onChange={(e) => {
                      const links = [...(proj.links || [])];
                      links[lIdx] = { ...links[lIdx], url: e.target.value };
                      updateArrayItem("projects", idx, "links", links);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive absolute right-0"
                    onClick={() => {
                      const links = [...(proj.links || [])];
                      links.splice(lIdx, 1);
                      updateArrayItem("projects", idx, "links", links);
                    }}
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={proj.description || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "projects",
                    idx,
                    "description",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Highlights (one per line)</Label>
              <Textarea
                value={(proj.highlights || []).join("\n")}
                onChange={(e) =>
                  updateArrayItem(
                    "projects",
                    idx,
                    "highlights",
                    e.target.value.split("\n").filter(Boolean),
                  )
                }
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Skills</h3>
          <p className="text-muted-foreground text-sm">
            Enter comma-separated values.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Languages</Label>
            <Input
              value={(data.skills?.languages || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "languages",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Frameworks</Label>
            <Input
              value={(data.skills?.frameworks || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "frameworks",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Tools</Label>
            <Input
              value={(data.skills?.tools || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "tools",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Databases</Label>
            <Input
              value={(data.skills?.databases || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "databases",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>ML & AI</Label>
            <Input
              value={(data.skills?.mlAndAi || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "mlAndAi",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>DevOps</Label>
            <Input
              value={(data.skills?.devops || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "devops",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Other</Label>
            <Input
              value={(data.skills?.other || []).join(", ")}
              onChange={(e) =>
                updateField(
                  "skills",
                  "other",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        </div>
      </section>

      {/* Socials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Socials</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem("socials", {
                platform: "linkedin",
                url: "",
                username: "",
              })
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Social Link
          </Button>
        </div>
        {data.socials?.map((social, idx) => (
          <div
            key={idx}
            className="bg-muted/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-2 right-2"
              onClick={() => removeArrayItem("socials", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <select
                  className="border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={social.platform}
                  onChange={(e) =>
                    updateArrayItem("socials", idx, "platform", e.target.value)
                  }
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="github">GitHub</option>
                  <option value="twitter">Twitter</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="stackoverflow">StackOverflow</option>
                  <option value="medium">Medium</option>
                  <option value="kaggle">Kaggle</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={social.url}
                  onChange={(e) =>
                    updateArrayItem("socials", idx, "url", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Username (Optional)</Label>
                <Input
                  value={social.username || ""}
                  onChange={(e) =>
                    updateArrayItem("socials", idx, "username", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Certifications */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Certifications</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem("certifications", { title: "", issuer: "" })
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        </div>
        {data.certifications?.map((cert, idx) => (
          <div
            key={idx}
            className="bg-muted/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-2 right-2"
              onClick={() => removeArrayItem("certifications", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={cert.title}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "title",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Issuer</Label>
                <Input
                  value={cert.issuer}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "issuer",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  value={cert.issueDate || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "issueDate",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  value={cert.expiryDate || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "expiryDate",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Credential ID</Label>
                <Input
                  value={cert.credentialId || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "credentialId",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Credential URL</Label>
                <Input
                  value={cert.credentialUrl || ""}
                  onChange={(e) =>
                    updateArrayItem(
                      "certifications",
                      idx,
                      "credentialUrl",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Languages */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Languages</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem("languages", {
                language: "",
                proficiency: "professional",
              })
            }
          >
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            Add Language
          </Button>
        </div>
        {data.languages?.map((lang, idx) => (
          <div
            key={idx}
            className="bg-muted/20 relative space-y-4 rounded-lg border p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive absolute top-2 right-2"
              onClick={() => removeArrayItem("languages", idx)}
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={lang.language}
                  onChange={(e) =>
                    updateArrayItem(
                      "languages",
                      idx,
                      "language",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Proficiency</Label>
                <select
                  className="border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={lang.proficiency}
                  onChange={(e) =>
                    updateArrayItem(
                      "languages",
                      idx,
                      "proficiency",
                      e.target.value,
                    )
                  }
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="professional">Professional</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <p className="text-muted-foreground text-sm">
          Enter achievements or awards, one per line.
        </p>
        <Textarea
          value={(data.achievements || []).join("\n")}
          onChange={(e) =>
            updateRootField(
              "achievements",
              e.target.value.split("\n").filter(Boolean),
            )
          }
          rows={5}
        />
      </section>
    </div>
  );
}
