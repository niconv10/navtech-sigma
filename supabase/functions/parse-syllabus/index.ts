import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify the caller is an authenticated SIGMA user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const { pdfBase64, fileName, syllabusText } = await req.json();

    // Support both base64 PDF and plain text
    const hasPdf = pdfBase64 && pdfBase64.length > 100;
    const hasText = syllabusText && syllabusText.length > 50;

    if (!hasPdf && !hasText) {
      return new Response(JSON.stringify({ error: "No valid syllabus content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsing syllabus:", hasPdf ? `PDF file: ${fileName}, base64 length: ${pdfBase64?.length}` : `Text length: ${syllabusText?.length}`);

    const systemPrompt = `You are an expert academic syllabus parser for SIGMA, a college grade tracking and academic intelligence app. Your job is to extract EVERY piece of relevant information from course syllabi with EXTREME ACCURACY and COMPREHENSIVENESS.

=============================================================================
CRITICAL PARSING RULES - READ CAREFULLY
=============================================================================

**RULE 1: UNDERSTAND POINT-BASED GRADING SYSTEMS**

Many syllabi use POINT SYSTEMS instead of percentages. You MUST:

1. **Calculate total points first**: Add up all point values mentioned
   Example: "500 points are the 5 presentations, 300 points are the 3 exams, 200 points are the 5 written assignments"
   Total = 500 + 300 + 200 = 1000 points

2. **Convert points to percentages**: (Category Points / Total Points) × 100
   Example:
   - Presentations: 500/1000 = 50%
   - Exams: 300/1000 = 30%
   - Written Assignments: 200/1000 = 20%

3. **Calculate individual assignment weights**: (Category Percentage / Number of Items)
   Example:
   - Each presentation: 50% ÷ 5 = 10% each = 100 points each
   - Each exam: 30% ÷ 3 = 10% each = 100 points each
   - Each written assignment: 20% ÷ 5 = 4% each = 40 points each

**RULE 2: ALWAYS SPLIT GROUPED ASSIGNMENTS INTO INDIVIDUAL ENTRIES**

EXAMPLES OF WHAT TO DO:

❌ WRONG: One entry "5 Presentations - 500 points"
✅ CORRECT: Five entries:
  - "Presentation 1" - 100 points - 10% weight
  - "Presentation 2" - 100 points - 10% weight
  - "Presentation 3" - 100 points - 10% weight
  - "Presentation 4" - 100 points - 10% weight
  - "Presentation 5" - 100 points - 10% weight

❌ WRONG: One entry "3 Exams - 300 points"
✅ CORRECT: Three entries:
  - "Exam 1" - 100 points - 10% weight
  - "Exam 2" - 100 points - 10% weight
  - "Exam 3" - 100 points - 10% weight

**CRITICAL — NO DATE FABRICATION:**
When splitting grouped assignments (e.g., "5 Presentations", "3 Exams"), set dueDate: null for EVERY individual entry UNLESS the syllabus explicitly provides a specific date for that exact item. Do NOT interpolate, estimate, calculate, or invent dates. A null dueDate is always correct when the date is not stated in the syllabus. This applies even if you know the semester dates or can infer a schedule.

**RULE 3: ASSIGNMENT TYPE MAPPING**

Map assignments to the correct type field:
- "Presentations" → type: "presentation"
- "Exams" / "Tests" → type: "exam"
- "Midterm" → type: "midterm"
- "Final Exam" → type: "final"
- "Written Assignments" / "Papers" / "Essays" → type: "paper"
- "Homework" / "Assignments" → type: "homework"
- "Quizzes" → type: "quiz"
- "Labs" / "Lab Work" → type: "lab"
- "Discussions" / "Discussion Posts" → type: "discussion"
- "Projects" → type: "project"
- "Participation" → type: "participation"
- Anything else → type: "other"

**RULE 4: EXTRACT EVERY POLICY DETAIL**

Look for and extract:
- Late work: Acceptance, penalties, exceptions
- Makeups: Conditions, process, restrictions
- Revisions: Allowed? How many? Deadline?
- Extra credit: Opportunities, max points, requirements
- Minimum requirements: Must pass final? Complete all assignments?
- Attendance: Impact on grade, allowed absences, penalties
- Drop lowest: Which categories? How many? Set the dropLowest field on the matching gradingCategory.
  Example: "I will drop your lowest quiz score" → Quizzes category: dropLowest: 1
  Example: "Drop lowest 2 homework grades" → Homework category: dropLowest: 2
  Example: "No drops mentioned" → All categories: dropLowest: 0
- Participation: How graded? What counts?
- Recording: Can students record? Are lectures recorded?
- Technology: Required software, hardware, internet speed
- Submission: Canvas? Email? In-person? File formats?

**RULE 5: CAPTURE ASSIGNMENT DETAILS**

For each assignment, extract:
- Submission method (Canvas, Email, Turnitin, In-person)
- File format requirements (PDF, DOCX, etc.)
- Is it group work or individual?
- Group size if applicable
- Rubric criteria if provided
- Proctoring requirements for exams
- Duration of exams/quizzes
- Open book vs closed book
- Allowed materials
- Revision policy for this assignment

**RULE 6: EXTRACT RESOURCE INFORMATION**

Look for:
- Tutoring centers (location, hours, cost, booking method)
- Mental health services (phone, hours, crisis line)
- Disability services (contact, documentation deadline)
- Technology lending (laptops, hotspots, calculators)
- Food pantry or emergency assistance
- Writing center, career services, library resources

**RULE 7: COMMUNICATION & TECHNOLOGY**

Extract:
- Response time expectations (24 hours? 48 hours? Business days only?)
- Office hours format (Zoom? In-person? By appointment?)
- Booking system (Calendly? Email? Walk-in?)
- Zoom links, passcodes
- Canvas course URL
- Recording locations
- After-hours/weekend availability
- Emergency contact info

**RULE 8: SEMESTER & DATES**

1. Identify semester and year FIRST (e.g., "Spring 2026")
2. Use the CORRECT YEAR for all dates (Spring 2026 = 2026, NOT 2025)
3. Format dates as YYYY-MM-DD
4. NEVER fabricate dates — if a date is not explicitly stated, use null
5. For the lateWork policy, extract maximumLateDays as a number:
   Example: "accepted up to 3 days late" → maximumLateDays: 3
   Example: "no late work accepted" → maximumLateDays: 0
   Example: "one week late maximum" → maximumLateDays: 7
   If only a penalty is mentioned with no day limit, set maximumLateDays: null
6. Extract ALL important dates:
   - First/last day of class
   - Drop deadline, withdrawal deadline
   - Holidays, breaks, no-class days
   - Exam dates
   - Assignment due dates (if provided in syllabus)

**RULE 9: WORKLOAD & EXPECTATIONS**

Look for:
- Estimated hours per week
- Breakdown (lecture time, reading, assignments, studying)
- Weekly structure (which days are lectures? Labs? Due dates?)
- Time commitment warnings

**RULE 10: COURSE-SPECIFIC POLICIES**

Extract policies about:
- Cell phones in class
- Laptop usage
- Food/drinks
- Children in class
- Pets/service animals
- Dress code for presentations
- Participation expectations

**RULE 11: AI POLICY TYPE — STRICT ENUM**

The aiPolicy.type field MUST be exactly one of these four values (no other text):
- "Prohibited"   — AI tools are explicitly not allowed in this course
- "Permitted"    — AI tools are explicitly allowed (with or without citation requirement)
- "Restricted"   — AI tools are allowed only for specific tasks, assignments, or with conditions
- "NotMentioned" — The syllabus does not mention AI tools, ChatGPT, or AI policy at all

Do NOT use "AI Prohibited", "AI Permitted", "AI Flexible", "AI Required", or any other variation.

**RULE 12: CONFIDENCE OBJECT AND PARSING WARNINGS**

After parsing, populate the confidence object based on what you actually found:
- gradesComplete: true if ALL grading categories have weights that sum to ~100%
- hasAllDates: true only if EVERY assignment has a non-null dueDate
- hasPolicies: true if late work and attendance policies were found
- weightSum: the actual numeric sum of all gradingCategory weights (e.g., 100 or 95)
- datesFoundCount: count of assignments where dueDate is NOT null

Populate parsingWarnings with a plain-English string for each issue found:
- Missing due dates: "X of Y assignments have no due date in syllabus"
- Weight mismatch: "Grading weights sum to X%, expected 100%"
- Missing policies: "No late work policy found"
- No AI policy: "No AI/ChatGPT policy mentioned in syllabus"
- Any other data quality issues you notice

=============================================================================
VALIDATION CHECKS BEFORE RETURNING
=============================================================================

Before returning your JSON, verify:
✓ All assignment weights sum to approximately 100%
✓ All grouped items are split into individual entries
✓ Point values are correctly distributed
✓ Assignment types use valid enum values
✓ Dates use correct year from semester
✓ All categories have correct count and weight
✓ Submission methods extracted for assignments
✓ Technology requirements captured
✓ Support resources include contact info
✓ Policies are comprehensive

Return ONLY valid JSON, no markdown, no explanation, no code blocks.`;

    const userPrompt = `Analyze this college course syllabus and extract ALL relevant information comprehensively.

${hasText ? `SYLLABUS TEXT:\n---\n${syllabusText.substring(0, 20000)}\n---\n` : ""}
${hasPdf ? `The syllabus PDF content is provided as an image. Please analyze it carefully and thoroughly.` : ""}

**CRITICAL INSTRUCTIONS:**

1. **Find the grading breakdown** - Look for point-based or percentage-based systems
2. **Calculate percentages** if given in points
3. **Split ALL grouped assignments** into individual entries
4. **Extract EVERY policy detail** mentioned
5. **Capture all technology and resource information**
6. **Use the correct semester year** for all dates
7. **Extract communication expectations and response times**
8. **Identify submission methods** for assignments
9. **Look for extra credit opportunities**
10. **Note minimum passing requirements**

Extract and return a JSON object with this EXACT structure:

{
  "course": {
    "code": "e.g., SPC 1017",
    "name": "e.g., Fundamentals of Speech Communication",
    "section": "e.g., 144 or null",
    "crn": "e.g., null",
    "credits": 3,
    "semester": "e.g., Spring 2026",
    "institution": "e.g., Palm Beach State College",
    "deliveryMode": "Live Online | In-Person | Hybrid | Fully Online | null",
    "description": "Course description from syllabus or null",
    "estimatedWorkload": {
      "hoursPerWeek": 9,
      "breakdown": {
        "lecture": 3,
        "reading": 2,
        "assignments": 3,
        "studying": 1
      }
    }
  },
  
  "instructor": {
    "name": "Full name with title",
    "email": "email@university.edu or null",
    "phone": "Phone number or null",
    "office": "Office location or null",
    "officeHours": "Schedule or null",
    "officeHoursFormat": "Zoom | In-Person | Hybrid | null",
    "officeHoursBooking": "Walk-in | Email | Calendly | null",
    "preferredContact": "Email | Canvas | Phone | null",
    "responseTime": "e.g., 24-48 hours weekdays or null",
    "weekendAvailability": false,
    "emergencyContact": "Department office contact or null"
  },
  
  "teachingAssistant": {
    "name": null,
    "email": null,
    "office": null,
    "officeHours": null,
    "responsibilities": null
  },
  
  "schedule": {
    "meetings": [
      {
        "day": "Wednesday",
        "startTime": "6:30 PM",
        "endTime": "9:20 PM",
        "location": "Room/building or Online",
        "type": "Lecture | Lab | Discussion | Studio"
      }
    ],
    "weeklyStructure": {
      "lectureDay": "Monday or null",
      "labDay": "Wednesday or null",
      "assignmentsDueDay": "Sunday or null",
      "assignmentsDueTime": "11:59 PM or null"
    },
    "finalExam": {
      "date": "2026-05-07 or null",
      "time": "Time or null",
      "location": "Location or null",
      "duration": "Minutes or null",
      "format": "Cumulative | Non-cumulative | null"
    }
  },
  
  "materials": {
    "textbooks": [
      {
        "title": "Book title",
        "author": "Author name or null",
        "isbn": "ISBN or null",
        "publisher": "Publisher or null",
        "edition": "Edition or null",
        "required": true,
        "cost": "Price or 'Free' or null",
        "note": "Additional notes or null",
        "whereToGet": "Campus bookstore | Online | null"
      }
    ],
    "software": [
      {
        "name": "Software name",
        "required": true,
        "cost": "Free | Price or null",
        "downloadUrl": "URL or null",
        "version": "Version number or null",
        "operatingSystem": "Windows | Mac | Linux | Web-based"
      }
    ],
    "accessCodes": [
      {
        "name": "Platform name",
        "required": true,
        "cost": "Price or 'Included' or null",
        "code": "Access code or null",
        "duration": "Semester | Lifetime or null"
      }
    ],
    "hardware": ["List of required hardware"],
    "other": ["Other materials like calculators, lab coats, etc."]
  },
  
  "technology": {
    "required": [
      {
        "name": "Webcam",
        "purpose": "Proctored exams",
        "specifications": "720p minimum or null"
      },
      {
        "name": "Microphone",
        "purpose": "Live class participation",
        "specifications": null
      }
    ],
    "recommended": ["Headphones", "Second monitor"],
    "internetSpeed": "5 Mbps minimum or null",
    "browser": "Chrome or Firefox (latest version)",
    "lmsAccess": {
      "platform": "Canvas | Blackboard | Moodle | etc.",
      "courseUrl": "Direct URL or null",
      "accessInstructions": "How to access or null"
    },
    "videoConferencing": {
      "platform": "Zoom | Teams | Google Meet | etc.",
      "meetingLink": "Permanent link or null",
      "meetingId": "ID or null",
      "passcode": "Passcode or null"
    }
  },
  
  "prerequisites": {
    "required": ["Course codes with minimum grades"],
    "corequisites": [],
    "recommended": [],
    "skills": ["Expected skills like 'Basic computer literacy'"]
  },
  
  "gradingScale": {
    "A": { "min": 90, "max": 100 },
    "B": { "min": 80, "max": 89 },
    "C": { "min": 70, "max": 79 },
    "D": { "min": 60, "max": 69 },
    "F": { "min": 0, "max": 59 }
  },
  
  "gradingCategories": [
    {
      "name": "Presentations",
      "weight": 50,
      "dropLowest": 0,
      "description": "5 presentations, 100 points each",
      "count": 5,
      "trackingMethod": "Canvas assignments or null",
      "allowedAbsences": 0,
      "penaltyPerMissed": "Percentage or null"
    }
  ],
  
  "assignments": [
    {
      "name": "Presentation 1",
      "type": "presentation",
      "category": "Presentations",
      "weight": 10,
      "points": 100,
      "perItemWeight": 10,
      "dueDate": "ONLY if a specific date is stated in the syllabus for this exact item — otherwise null",
      "dueTime": "11:59 PM or null",
      "module": 1,
      "description": "Description or null",
      "notes": "Additional notes or null",
      "submissionMethod": "Canvas | Email | In-person | Turnitin | null",
      "fileFormat": ["PDF", "DOCX"],
      "submissionLimit": "One attempt | Multiple attempts | null",
      "lateSubmissionAllowed": true,
      "isGroupWork": false,
      "groupSize": "e.g., 3-5 students or null",
      "rubric": {
        "criteria": [
          {
            "name": "Content",
            "points": 40,
            "description": "Depth and accuracy"
          },
          {
            "name": "Delivery",
            "points": 30,
            "description": "Presentation skills"
          },
          {
            "name": "Visuals",
            "points": 30,
            "description": "Slide design and effectiveness"
          }
        ]
      },
      "examDetails": {
        "format": "Multiple choice + Essay or null",
        "duration": "Minutes or null",
        "proctoring": "Respondus | Honorlock | None | null",
        "openBook": false,
        "allowedMaterials": ["Calculator"],
        "retakePolicy": "No retakes or null"
      }
    }
  ],
  
  "modules": [
    {
      "number": 1,
      "title": "Module title",
      "dates": {
        "start": "2026-01-12",
        "end": "2026-01-18"
      },
      "topics": ["Topic 1", "Topic 2"],
      "readings": ["Chapter 1", "Article on Canvas"],
      "assignments": ["Assignment names"],
      "learningObjectives": ["What students will learn"]
    }
  ],
  
  "policies": {
    "lateWork": {
      "accepted": true,
      "penalty": "10 points deduction or 10% per day",
      "details": "Full description of late policy",
      "maximumLateDays": 1,
      "exceptionsAllowed": true,
      "exceptionConditions": "Medical emergency with documentation",
      "projectPolicy": "Different rules for projects if applicable"
    },
    "attendance": {
      "required": true,
      "impactsGrade": true,
      "trackingMethod": "Sign-in | Canvas login | null",
      "allowedAbsences": 2,
      "penaltyPerAbsence": "1% off final grade",
      "tardyPolicy": "3 tardies = 1 absence",
      "earlyLeavePolicy": "Same as tardy",
      "details": "Full attendance policy description",
      "excusedAbsences": ["Medical", "Religious observance", "University event"],
      "documentationRequired": true
    },
    "makeupExams": {
      "allowed": true,
      "conditions": "Contact within 24 hours with documentation",
      "deadline": "Within one week",
      "penalties": "10% deduction or null",
      "differentVersion": true,
      "location": "Outside of class | Testing center | null"
    },
    "revisionPolicy": {
      "allowed": true,
      "assignments": ["Essays", "Projects"],
      "deadline": "Within 1 week of grade return",
      "maxImprovement": "Up to B grade",
      "penalty": "None",
      "numberAllowed": 1,
      "process": "Submit original with revisions tracked"
    },
    "dropPolicy": {
      "exists": false,
      "details": "e.g., Lowest 2 quizzes dropped or null",
      "categories": []
    },
    "curvePolicy": {
      "exists": false,
      "details": "How curve is applied or null",
      "guaranteed": false
    },
    "extraCredit": {
      "available": true,
      "opportunities": [
        {
          "name": "Research participation",
          "points": 5,
          "percentage": null,
          "description": "Participate in psychology studies",
          "deadline": "2026-04-30"
        }
      ],
      "maxPoints": 10,
      "canRaiseLetterGrade": true,
      "restrictions": "Cannot raise grade more than one letter"
    },
    "minimumRequirements": [
      {
        "requirement": "Must score 60% on final to pass",
        "category": "Final Exam",
        "minimumScore": 60,
        "minimumPercentage": null,
        "mustComplete": false,
        "consequences": "Automatic F regardless of other grades"
      }
    ],
    "gradingTimeline": {
      "homework": "7 days",
      "exams": "10 days",
      "projects": "14 days",
      "finalGrades": "Within 72 hours of final exam",
      "gradeChallengeWindow": "48 hours after grade posted"
    },
    "participation": {
      "required": true,
      "trackingMethod": "In-class questions | Canvas discussions | Polls",
      "weight": 10,
      "details": "What counts as participation",
      "makeupPolicy": "No makeup for missed participation"
    },
    "recording": {
      "instructorRecordsLectures": true,
      "recordingsAvailableFor": "72 hours | Until end of semester",
      "recordingsLocation": "Canvas > Media Gallery",
      "studentCanRecord": false,
      "studentRecordingRequires": "Written permission from instructor and all students",
      "violationConsequences": "Removal from course",
      "details": "Full recording policy"
    },
    "courseSpecific": {
      "cellPhones": "Off and away during class",
      "laptops": "Note-taking only",
      "tablets": "Allowed for notes",
      "food": "Drinks allowed, no food",
      "childrenInClass": "Emergency only with prior notice",
      "pets": "Service animals only",
      "dressCode": "Professional business casual for presentations or null",
      "other": []
    }
  },
  
  "aiPolicy": {
    "type": "Prohibited | Permitted | Restricted | NotMentioned",
    "permitted": false,
    "restrictions": "Full description of restrictions",
    "citationRequired": false,
    "citationFormat": "URL to citation guide or null",
    "allowedTools": [],
    "prohibitedTools": ["ChatGPT", "Claude"],
    "assignmentSpecific": {
      "Essay 1": "AI prohibited",
      "Final Project": "AI permitted with citation"
    },
    "detectionMethod": "Turnitin AI detection | GPTZero | Manual review",
    "consequences": "Zero on assignment + report to Dean",
    "details": "Full AI policy explanation"
  },
  
  "writingRequirements": {
    "citationStyle": "APA 7th Edition | MLA | Chicago | null",
    "minimumSources": 5,
    "sourceTypes": ["Peer-reviewed journals preferred"],
    "sourceRestrictions": ["No Wikipedia", "No blogs"],
    "plagiarismChecker": "Turnitin | SafeAssign | null",
    "similarityThreshold": "20% maximum",
    "quotationLimit": "No more than 10% of paper",
    "paraphrasingRequired": true
  },
  
  "academicIntegrity": {
    "summary": "Zero tolerance policy summary",
    "plagiarismPolicy": "Full definition and policy",
    "cheatingDefinition": "What constitutes cheating",
    "fabricationPolicy": "Policy on fabricated data/sources",
    "collaborationRules": {
      "homework": "Discuss but write independently",
      "projects": "Group work required",
      "exams": "No collaboration whatsoever"
    },
    "consequences": {
      "firstOffense": "Zero on assignment + report to Dean",
      "secondOffense": "F in course + academic probation",
      "thirdOffense": "Expulsion"
    },
    "reportingProcess": "How violations are reported",
    "appealProcess": "Contact Dean of Students within 5 business days",
    "honorCodeUrl": "URL to full honor code"
  },
  
  "importantDates": {
    "firstDay": "2026-01-12",
    "lastDay": "2026-05-07",
    "lastDayToDrop": "2026-02-01",
    "withdrawalDeadline": "2026-03-22",
    "springBreak": {
      "start": "2026-03-09",
      "end": "2026-03-13"
    },
    "holidays": [
      {
        "name": "MLK Day",
        "date": "2026-01-19",
        "classHeld": false
      }
    ],
    "noClassDates": ["2026-02-15", "2026-04-10"],
    "examDates": {
      "midterm": "2026-03-05",
      "final": "2026-05-07"
    },
    "finalExamDate": "2026-05-07"
  },
  
  "learningObjectives": [
    "Objective 1",
    "Objective 2",
    "Objective 3"
  ],
  
  "supportResources": {
    "tutoring": {
      "name": "Learning Center",
      "location": "Building A, Room 101",
      "hours": "Mon-Thu 8am-8pm, Fri 8am-5pm",
      "phone": "561-555-1234",
      "email": "tutoring@university.edu",
      "cost": "Free",
      "appointment": "Walk-in or online booking",
      "bookingUrl": "URL or null",
      "services": ["Math", "Writing", "Science"]
    },
    "writing": {
      "name": "Writing Center",
      "location": "Library 2nd floor",
      "hours": "Mon-Fri 9am-5pm",
      "phone": "561-555-5678",
      "email": "writing@university.edu",
      "appointment": "Required",
      "bookingUrl": "URL or null"
    },
    "counseling": {
      "name": "Counseling Services",
      "location": "Student Services Building",
      "phone": "561-297-2273",
      "crisisLine": "561-297-2273 (24/7)",
      "hours": "Mon-Fri 8am-5pm",
      "emergencyAfterHours": true
    },
    "disability": {
      "name": "Disability Services",
      "location": "Building location",
      "phone": "Phone number",
      "email": "Email",
      "website": "www.university.edu/disability",
      "registrationDeadline": "First week of classes",
      "documentationRequired": true
    },
    "techSupport": {
      "name": "IT Help Desk",
      "phone": "561-868-4000",
      "email": "helpdesk@university.edu",
      "hours": "24/7",
      "onlineSupport": "Chat available on website"
    },
    "library": {
      "name": "University Library",
      "phone": "Phone",
      "hours": "Hours",
      "services": ["Research assistance", "Interlibrary loan"],
      "librarianContact": "Subject librarian email"
    },
    "careerServices": {
      "available": true,
      "services": ["Resume review", "Interview prep", "Job search"],
      "location": "Location or null"
    },
    "foodPantry": {
      "available": true,
      "location": "Student Union 210",
      "hours": "Mon/Wed 10am-2pm",
      "eligibility": "All students"
    },
    "emergencyAssistance": {
      "available": true,
      "contact": "Contact info",
      "services": ["Emergency loans", "Housing assistance"]
    },
    "technologyLending": {
      "laptops": true,
      "hotspots": true,
      "calculators": false,
      "cameras": false,
      "checkoutPeriod": "Semester-long | Daily | Weekly",
      "location": "Library circulation desk"
    },
    "other": []
  },
  
  "accessibility": {
    "statementIncluded": true,
    "officeName": "Disability Services",
    "officeContact": "Phone/email",
    "registrationRequired": true,
    "documentationDeadline": "First week of classes",
    "documentationTypes": ["Medical", "Psychological", "Learning disability"],
    "commonAccommodations": ["Extended time", "Note-taker", "Quiet room"],
    "technologySupport": "Screen readers supported in Canvas",
    "examAccommodations": "Testing center available",
    "materialFormats": ["Large print", "Audio", "Digital"]
  },
  
  "communication": {
    "primaryMethod": "Email",
    "emailResponseTime": "24-48 hours weekdays",
    "canvasMessageResponseTime": "Same business day",
    "phoneResponseTime": "Within 24 hours",
    "officeHoursFormat": "Zoom by appointment",
    "officeHoursBooking": "Email instructor",
    "afterHoursContact": "Email only",
    "weekendAvailability": false,
    "emergencyContact": "Department office: 561-555-1234",
    "announcementFrequency": "Weekly via Canvas",
    "discussionPlatform": "Canvas Discussions",
    "videoConference": "Zoom",
    "preferredQuestionMethod": "Office hours for complex questions, email for simple"
  },
  
  "withdrawalPolicy": {
    "studentInitiated": true,
    "deadline": "2026-03-22",
    "process": "Submit through student portal",
    "gradeReceived": "W",
    "refundPolicy": "Prorated based on date",
    "instructorCanWithdraw": true,
    "instructorWithdrawalConditions": "Four consecutive absences",
    "consequences": "No refund after deadline"
  },

  "confidence": {
    "gradesComplete": true,
    "hasAllDates": false,
    "hasPolicies": true,
    "weightSum": 100,
    "datesFoundCount": 3
  },

  "parsingWarnings": [
    "12 of 15 assignments have no due date in syllabus",
    "Grading weights sum to 95%, expected 100%"
  ]
}

IMPORTANT FINAL CHECKS:
✓ Did you split ALL grouped assignments into individual entries?
✓ Do all assignment weights sum to 100%?
✓ Did you set dueDate: null for assignments with no explicit date in the syllabus?
✓ Did you use the correct year from the semester for all dates?
✓ Did you map assignment types correctly?
✓ Did you calculate perItemWeight for every assignment (= category weight ÷ count)?
✓ Did you set dropLowest on each gradingCategory (0 if not mentioned)?
✓ Is aiPolicy.type exactly one of: Prohibited | Permitted | Restricted | NotMentioned?
✓ Did you extract maximumLateDays as a number (not buried in penalty text)?
✓ Did you populate confidence.weightSum with the actual numeric total?
✓ Did you populate confidence.datesFoundCount with the actual count?
✓ Did you list all data quality issues in parsingWarnings?
✓ Did you extract submission methods for assignments?
✓ Did you capture technology requirements?
✓ Did you include contact info for all support resources?
✓ Did you extract extra credit opportunities?
✓ Did you note minimum passing requirements?
✓ Did you capture recording policies?
✓ Did you extract communication response times?

Return ONLY the JSON object, nothing else.`;

    // Build message content for the Anthropic Messages API
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

    const userContent: ContentBlock[] = [];

    if (hasPdf) {
      // Anthropic natively supports PDF documents via the document content type
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: pdfBase64,
        },
      });
    }

    userContent.push({
      type: "text",
      text: userPrompt,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        max_tokens: 16384,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error — status: ${response.status}, body: ${errorText}`);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Surface the actual Anthropic error so the client can see what went wrong
      let anthropicMessage = `Anthropic API returned ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.error?.message) anthropicMessage = parsed.error.message;
      } catch { /* errorText wasn't JSON */ }

      throw new Error(anthropicMessage);
    }

    const aiResponse = await response.json();
    console.log("Anthropic response — stop_reason:", aiResponse.stop_reason, "model:", aiResponse.model);

    // Anthropic Messages API response: { content: [{ type: "text", text: "..." }], ... }
    const content = aiResponse.content?.[0]?.text;

    if (!content) {
      console.error("Empty AI response:", JSON.stringify(aiResponse));
      throw new Error(`AI returned no content (stop_reason: ${aiResponse.stop_reason ?? "unknown"})`);
    }

    console.log("AI response received, parsing JSON...");

    // Clean and parse the JSON response
    let parsedData;
    try {
      let cleanJson = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      // Try to find JSON object boundaries if extra text surrounds it
      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content.substring(0, 500));
      console.error("Response length:", content.length, "Last 200 chars:", content.substring(content.length - 200));
      throw new Error("Failed to parse syllabus data - AI response was not valid JSON");
    }

    console.log("Successfully parsed syllabus data");
    console.log("Course:", parsedData.course?.code || "Unknown");
    console.log("Assignments:", parsedData.assignments?.length || 0);
    console.log("Grading categories:", parsedData.gradingCategories?.length || 0);

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack   = error instanceof Error ? error.stack  : undefined;
    console.error("Error in parse-syllabus function:", message, stack ?? "");
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
