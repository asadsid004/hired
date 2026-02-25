"use client";

import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Link,
  Svg,
  Path,
  Circle,
} from "@react-pdf/renderer";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function fmtYYYYMM(raw?: string | null): string {
  if (!raw) return "";
  const [y, m] = raw.split("-");
  if (!y) return raw;
  if (!m) return y;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const label = months[parseInt(m, 10) - 1] ?? m;
  return `${label} ${y}`;
}

function dateRange(
  start?: string | null,
  end?: string | null,
  isCurrent?: boolean,
): string {
  const s = fmtYYYYMM(start);
  const e = isCurrent ? "Present" : fmtYYYYMM(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

type IconFC = () => React.ReactElement;

/** Wrap a 24×24 fill-based path into a compact SVG component */
const mkSvg = (d: string, size = 9): IconFC =>
  function PdfIcon() {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={d} fill="#000" />
      </Svg>
    );
  };

const mkSvgMulti = (children: React.ReactElement, size = 9): IconFC =>
  function PdfIconMulti() {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {children}
      </Svg>
    );
  };

// Contact icons
const PhoneIcon = mkSvg(
  "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
);

const EmailIcon = mkSvg(
  "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
);

const LocationIcon = mkSvg(
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
);

// Social / platform icons
const LinkedInIcon = mkSvg(
  "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
);

const GitHubIcon = mkSvg(
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
);

const TwitterXIcon = mkSvg(
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
);

// Medium is multi-circle so use mkSvgMulti
const MediumIcon = mkSvgMulti(
  <>
    <Circle cx="6.77" cy="12" r="6.77" fill="#000" />
    <Path
      d="M17.58 5.58c-1.87 0-3.39 2.88-3.39 6.42s1.52 6.42 3.39 6.42 3.38-2.88 3.38-6.42-1.51-6.42-3.38-6.42z"
      fill="#000"
    />
    <Path
      d="M22.81 7c-.66 0-1.19 2.25-1.19 5.02s.53 5.02 1.19 5.02 1.19-2.25 1.19-5.02S23.47 7 22.81 7z"
      fill="#000"
    />
  </>,
);

const KaggleIcon = mkSvg(
  "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 17.5h-2v-11h2v5.25L15.3 6.5H18l-4.8 5.25 5.3 5.75H16l-5.5-6.25v6.25z",
);

const StackOverflowIcon = mkSvg(
  "M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zm-.784 5.367V24H18v-5.89h-1.79v4.1H5.99v-4.1H4.001zm2 1.79v1.79h9.19v-1.79H5.001z",
);

const GlobeIcon = mkSvg(
  "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z",
);

const LinkIcon = mkSvg(
  "M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z",
);

function getPlatformIcon(platform: string): IconFC {
  const p = platform.toLowerCase();
  if (p === "linkedin") return LinkedInIcon;
  if (p === "github") return GitHubIcon;
  if (p === "twitter") return TwitterXIcon;
  if (p === "medium") return MediumIcon;
  if (p === "kaggle") return KaggleIcon;
  if (p === "stackoverflow") return StackOverflowIcon;
  if (p === "portfolio") return GlobeIcon;
  return LinkIcon;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 30,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.35,
    color: "#000",
  },

  // Header
  headerName: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  contactRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: 9,
    gap: 2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  contactSep: {
    color: "#555",
    fontSize: 9,
    marginHorizontal: 2,
  },
  contactLink: {
    color: "#000",
    textDecoration: "none",
    fontFamily: "Times-Roman",
    fontSize: 9,
  },

  // Section
  section: { marginBottom: 7 },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 1,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Skills – label + value on one row
  skillRow: { flexDirection: "row", marginBottom: 1.5 },
  skillLabel: { fontFamily: "Times-Bold", width: 130 },
  skillValue: { flex: 1 },

  // Entry items (experience / projects / education)
  item: { marginBottom: 5 },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  itemSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  bold: { fontFamily: "Times-Bold" },
  italic: { fontFamily: "Times-Italic" },

  // Bullets
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 10,
  },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, textAlign: "justify" },

  // Certifications row
  certRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
    paddingLeft: 4,
    gap: 4,
  },
  certBody: { flex: 1 },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

interface ResumePDFProps {
  data: ResumeProfile;
  fileName?: string;
}

const ATSResumePDF = ({ data, fileName }: ResumePDFProps) => {
  const {
    personalInfo,
    socials,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    languages,
    achievements,
  } = data;

  // Build contact items with SVG icon + text + optional href
  type ContactItem = { text: string; href?: string; Icon: IconFC };
  const contactItems: ContactItem[] = [];

  if (personalInfo?.phone)
    contactItems.push({ text: personalInfo.phone, Icon: PhoneIcon });

  if (personalInfo?.email)
    contactItems.push({
      text: personalInfo.email,
      href: `mailto:${personalInfo.email}`,
      Icon: EmailIcon,
    });

  socials?.forEach((s) => {
    const label = s.username ?? s.url.replace(/^https?:\/\/(www\.)?/, "");
    contactItems.push({
      text: label,
      href: s.url,
      Icon: getPlatformIcon(s.platform),
    });
  });

  if (personalInfo?.location) {
    const parts = [
      personalInfo.location.city,
      personalInfo.location.state,
      personalInfo.location.country,
    ].filter(Boolean);
    if (parts.length)
      contactItems.push({ text: parts.join(", "), Icon: LocationIcon });
  }

  const hasSkills =
    skills &&
    Object.values(skills).some((v) => v && (v as string[]).length > 0);

  return (
    <Document title={fileName ?? "resume"} author={personalInfo?.name ?? ""}>
      <Page size="A4" style={S.page}>
        {/* ── NAME */}
        <Text style={S.headerName}>{personalInfo?.name ?? "YOUR NAME"}</Text>

        {/* ── CONTACT ROW – SVG icon + text/link per item */}
        {contactItems.length > 0 && (
          <View style={S.contactRow}>
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                <View style={S.contactItem}>
                  <item.Icon />
                  {item.href ? (
                    <Link src={item.href} style={S.contactLink}>
                      {item.text}
                    </Link>
                  ) : (
                    <Text style={{ fontSize: 9 }}>{item.text}</Text>
                  )}
                </View>
                {i < contactItems.length - 1 && (
                  <Text style={S.contactSep}>|</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* ── SUMMARY */}
        {summary && (
          <View style={[S.section, { marginTop: 8 }]}>
            <Text style={S.sectionHeading}>Professional Summary</Text>
            <Text style={{ textAlign: "justify" }}>{summary}</Text>
          </View>
        )}

        {/* ── TECHNICAL SKILLS */}
        {hasSkills && (
          <View style={[S.section, { marginTop: 8 }]}>
            <Text style={S.sectionHeading}>Technical Skills</Text>
            {skills?.languages && skills.languages.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>Languages: </Text>
                {skills.languages.join(", ")}
              </Text>
            )}
            {skills?.tools && skills.tools.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>Tools: </Text>
                {skills.tools.join(", ")}
              </Text>
            )}
            {skills?.frameworks && skills.frameworks.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>Libraries/Frameworks: </Text>
                {skills.frameworks.join(", ")}
              </Text>
            )}
            {skills?.databases && skills.databases.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>Databases: </Text>
                {skills.databases.join(", ")}
              </Text>
            )}
            {skills?.mlAndAi && skills.mlAndAi.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>ML / AI: </Text>
                {skills.mlAndAi.join(", ")}
              </Text>
            )}
            {skills?.devops && skills.devops.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>DevOps: </Text>
                {skills.devops.join(", ")}
              </Text>
            )}
            {skills?.other && skills.other.length > 0 && (
              <Text style={S.skillRow}>
                <Text style={S.bold}>Other: </Text>
                {skills.other.join(", ")}
              </Text>
            )}
          </View>
        )}

        {/* ── WORK EXPERIENCE */}
        {experience && experience.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Work Experience</Text>
            {experience.map((exp, i) => (
              <View key={i} style={S.item}>
                <View style={S.itemHeaderRow}>
                  <Text style={S.bold}>{exp.company}</Text>
                  <Text style={S.bold}>
                    {dateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </Text>
                </View>
                <View style={S.itemSubRow}>
                  <Text style={S.italic}>{exp.position}</Text>
                  {exp.location && <Text style={S.italic}>{exp.location}</Text>}
                </View>
                {exp.technologies && exp.technologies.length > 0 && (
                  <Text style={{ marginBottom: 2 }}>
                    <Text style={S.italic}>Technologies: </Text>
                    {exp.technologies.join(", ")}
                  </Text>
                )}
                {exp.description && (
                  <Text style={{ marginBottom: 2 }}>{exp.description}</Text>
                )}
                {exp.achievements?.map((a, j) => (
                  <View key={j} style={S.bulletRow}>
                    <Text style={S.bulletDot}>•</Text>
                    <Text style={S.bulletText}>{a}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── PROJECTS */}
        {projects && projects.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Projects</Text>
            {projects.map((proj, i) => {
              const techs = proj.technologies?.join(" | ") ?? "";
              const dates = dateRange(proj.startDate, proj.endDate);
              const rightCol = dates || techs;

              return (
                <View key={i} style={S.item}>
                  <View style={S.itemHeaderRow}>
                    <Text>
                      <Text style={S.bold}>{proj.title}</Text>
                      {proj.links && proj.links.length > 0 && (
                        <Text style={S.italic}>
                          {" | "}
                          {proj.links.map((link, lIdx) => (
                            <React.Fragment key={lIdx}>
                              <Link
                                src={link.url}
                                style={{
                                  color: "#000",
                                  textDecoration: "none",
                                }}
                              >
                                {link.type.charAt(0).toUpperCase() +
                                  link.type.slice(1)}
                              </Link>
                              {lIdx < proj.links!.length - 1 && " • "}
                            </React.Fragment>
                          ))}
                        </Text>
                      )}
                    </Text>
                    <Text style={S.bold}>{rightCol}</Text>
                  </View>
                  {/* If both dates and techs, show techs on a second line */}
                  {dates && techs && (
                    <View style={[S.itemSubRow, { marginBottom: 1 }]}>
                      <Text />
                      <Text style={S.bold}>{techs}</Text>
                    </View>
                  )}
                  {proj.description && (
                    <Text style={{ marginBottom: 2, marginTop: 1 }}>
                      {proj.description}
                    </Text>
                  )}
                  {proj.highlights?.map((h, j) => (
                    <View key={j} style={S.bulletRow}>
                      <Text style={S.bulletDot}>•</Text>
                      <Text style={S.bulletText}>{h}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* ── EDUCATION */}
        {education && education.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Education</Text>
            {education.map((edu, i) => {
              const range = edu.startDate
                ? dateRange(edu.startDate, edu.endDate)
                : edu.endDate
                  ? `Passing year – ${fmtYYYYMM(edu.endDate)}`
                  : "";
              const subLeft = edu.cgpaOrPercentage
                ? `${edu.degree} — ${edu.cgpaOrPercentage}`
                : edu.degree;
              return (
                <View key={i} style={S.item}>
                  <View style={S.itemHeaderRow}>
                    <Text style={S.bold}>{edu.school}</Text>
                    <Text style={S.bold}>{range}</Text>
                  </View>
                  <View style={S.itemSubRow}>
                    <Text style={S.italic}>{subLeft}</Text>
                    {edu.location && (
                      <Text style={S.italic}>{edu.location}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── CERTIFICATIONS */}
        {certifications && certifications.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Certifications</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={S.bulletRow}>
                <Text style={S.bulletDot}>•</Text>
                <Text style={S.bulletText}>
                  <Text style={S.bold}>{cert.title}</Text>
                  {" — "}
                  <Text>{cert.issuer}</Text>
                  {cert.issueDate ? (
                    <Text
                      style={S.italic}
                    >{`, ${fmtYYYYMM(cert.issueDate)}`}</Text>
                  ) : null}
                  {cert.expiryDate ? (
                    <Text
                      style={S.italic}
                    >{` · Expires ${fmtYYYYMM(cert.expiryDate)}`}</Text>
                  ) : null}
                  {cert.credentialId ? (
                    <Text>{`  ·  ID: ${cert.credentialId}`}</Text>
                  ) : null}
                  {cert.credentialUrl ? (
                    <Text>
                      {"  ·  "}
                      <Link
                        src={cert.credentialUrl}
                        style={{ color: "#000", textDecoration: "none" }}
                      >
                        View Credential
                      </Link>
                    </Text>
                  ) : null}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── LANGUAGES (spoken) */}
        {languages && languages.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Languages</Text>
            <Text>
              {languages
                .map(
                  (l) =>
                    `${l.language} (${l.proficiency.charAt(0).toUpperCase() + l.proficiency.slice(1)})`,
                )
                .join("   ")}
            </Text>
          </View>
        )}

        {/* ── ACHIEVEMENTS */}
        {achievements && achievements.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionHeading}>Achievements</Text>
            {achievements.map((a, i) => (
              <View key={i} style={S.bulletRow}>
                <Text style={S.bulletDot}>•</Text>
                <Text style={S.bulletText}>{a}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────

export default function ResumePreview({ data, fileName }: ResumePDFProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="bg-muted h-[880px] w-full animate-pulse rounded-xl" />
    );

  return (
    <div className="bg-muted/20 flex h-[900px] w-full items-center justify-center overflow-hidden rounded-xl border shadow-sm">
      <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
        <ATSResumePDF data={data} fileName={fileName} />
      </PDFViewer>
    </div>
  );
}
