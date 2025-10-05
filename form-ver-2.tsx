// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"
import { useMeasuredSize } from "https://framer.com/m/framer/useMeasuredSize.js"

/**
 * @framerDisableUnlink
 */
export default function QASLeadManagementForm(props) {
    const {
        supabaseUrl = "https://gzgebiosasfyzwwkrsof.supabase.co",
        supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z2ViaW9zYXNmeXp3d2tyc29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNTg4NjcsImV4cCI6MjA3NDYzNDg2N30.XNI4MJecZPAK87i8I1pHoiAYBcYNDZcCoEjaikPuA60",
        n8nUrl = "https://n8n-280z.onrender.com",
        style,
    } = props

    const containerRef = useRef(null)
    const measured = useMeasuredSize(containerRef)

    // Responsive breakpoints
    const isMobile = measured?.width && measured.width < 640
    const isTablet =
        measured?.width && measured.width >= 640 && measured.width < 1024
    const isDesktop = measured?.width && measured.width >= 1024

    // Dynamic spacing based on screen size
    const spacing = {
        container: isMobile
            ? "20px 16px"
            : isTablet
              ? "40px 24px"
              : "60px 32px",
        section: isMobile ? "16px" : isTablet ? "24px" : "32px",
        element: isMobile ? "12px" : isTablet ? "16px" : "20px",
        header: isMobile ? "24px" : isTablet ? "32px" : "40px",
        formContent: isMobile ? "16px" : isTablet ? "20px" : "24px",
    }

    // Dynamic font sizes
    const fontSize = {
        title: isMobile ? "24px" : isTablet ? "28px" : "32px",
        subtitle: isMobile ? "14px" : isTablet ? "16px" : "18px",
        heading: isMobile ? "18px" : isTablet ? "20px" : "22px",
        body: isMobile ? "14px" : isTablet ? "15px" : "16px",
        small: isMobile ? "12px" : "13px",
    }

    // Simple priority scoring (no complex logic)
    const calculatePriorityScore = (formData) => {
        let score = 0

        // Base score from form completion
        const requiredFields = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "course",
        ]
        const completedFields = requiredFields.filter(
            (field) => formData[field] && formData[field].trim() !== ""
        )
        score += (completedFields.length / requiredFields.length) * 40

        // Additional data quality points
        if (formData.satScore && parseInt(formData.satScore) > 0) score += 10
        if (formData.birthYear && parseInt(formData.birthYear) > 1990)
            score += 5
        // removed school scoring
        if (formData.targetScore && parseInt(formData.targetScore) >= 1400)
            score += 10
        // removed contact methods scoring
        if (formData.learningPurpose && formData.learningPurpose !== "")
            score += 10
        if (formData.testDate && formData.testDate !== "") score += 10
        if (formData.discoverySource && formData.discoverySource !== "")
            score += 5

        // Determine priority level
        if (score >= 100) return { level: 1, label: "Ready to Enroll", score }
        if (score >= 85) return { level: 2, label: "Urgency High", score }
        if (score >= 65) return { level: 3, label: "Experience", score }
        if (score >= 45) return { level: 4, label: "Unclear Need", score }
        if (score >= 25) return { level: 5, label: "Awareness", score }
        return { level: 6, label: "New Lead", score }
    }

    // Engagement pools
    const engagementPools = {
        sales: {
            name: "Sales Pool (Enroll Now)",
            description: "Direct conversion pool for immediate enrollment",
            color: "#dc2626",
            icon: "🎯",
        },
        consulting: {
            name: "Consulting Pool (Book Call)",
            description: "Personalized guidance and consultation",
            color: "#ea580c",
            icon: "📞",
        },
        experience: {
            name: "Experience Pool (Demo + Free Material)",
            description: "Product experience and free resources",
            color: "#d97706",
            icon: "🎮",
        },
        nurture: {
            name: "Nurture Pool (Long-term tips + soft CTA)",
            description: "Long-term engagement with valuable content",
            color: "#059669",
            icon: "🌱",
        },
        education: {
            name: "Education Pool (SAT Basics)",
            description: "Educational content and SAT basics",
            color: "#0891b2",
            icon: "📚",
        },
        giveaway: {
            name: "Giveaway Pool (Community + Freebies)",
            description: "Community access and freebies",
            color: "#7c3aed",
            icon: "🎁",
        },
    }

    // Simple engagement pool determination
    const determineEngagementPool = (priority) => {
        const { level } = priority

        if (level === 1) return "sales"
        if (level === 2) return "consulting"
        if (level === 3) return "experience"
        if (level === 4) return "education"
        if (level === 5) return "education"
        return "nurture"
    }

    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [rateLimitError, setRateLimitError] = useState("")
    const [formData, setFormData] = useState({
       // Step 1: SAT Test Status
        satTestStatus: "", // "taken" or "never"
        satScore: 1000, // Current SAT score (slider value)

        // Step 2: Exam Plan (testDate, targetScore)
        testDate: "",
        targetScore: 1400,
        
        // Step 3: Personal Info Part 1 (fullName, birthYear, email)
        fullName: "",
        birthYear: "",
        email: "",
        
        // Step 4: Personal Info Part 2 (phone, facebookLink)
        phone: "",
        facebookLink: "",

        // Step 5: Discovery Sources (multiple checkboxes)
        discoverySources: [], // Array of selected sources
        customDiscoverySource: "", // For "Khác" option

        // Step 6: Course
        course: "",
    })

    // Calculate priority and pool for display (simple calculation)
    const priorityData = calculatePriorityScore(formData)
    const engagementPool = determineEngagementPool(priorityData)

    // Removed locationData and countries const

    // Simple rate limiting (no localStorage)
    const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
    const MAX_SUBMISSIONS = 3 // Max submissions per window
    const STORAGE_KEY = "qas_form_submissions"

    // Simple submission data preparation
    const prepareSubmissionData = (formData, isCompleted = false) => {
        const priority = calculatePriorityScore(formData)
        const pool = determineEngagementPool(priority)

        return {
            course: formData.course || "",
            sat_score:
                formData.satScore && typeof formData.satScore === 'number'
                    ? formData.satScore
                    : null,
            // removed voucher_code
            // Split fullName into first_name and last_name
            first_name: formData.fullName ? formData.fullName.trim().split(" ").slice(0, -1).join(" ") || formData.fullName.trim() : "",
            last_name: formData.fullName ? formData.fullName.trim().split(" ").slice(-1).join(" ") : "",
            birth_year: formData.birthYear
                ? parseInt(formData.birthYear)
                : null,
            email: formData.email ? formData.email.trim() : "",
            phone: formData.phone ? formData.phone.trim() : "",
            facebook_link: formData.facebookLink || "",
            // removed country/state/school
            discovery_source: Array.isArray(formData.discoverySources) 
                ? formData.discoverySources.join(", ") 
                : "",
            // removed contact_methods and learning_purpose
            test_date: formData.testDate || "",
            target_score: formData.targetScore || 1400,
            is_completed: isCompleted,
            is_qualified: !!(
                formData.fullName?.trim() &&
                formData.birthYear &&
                formData.email?.trim() &&
                formData.phone?.trim()
            ),
            // Lead management fields
            priority_level: priority.level,
            priority_score: priority.score,
            priority_label: priority.label,
            engagement_pool: pool,
            pool_name: engagementPools[pool]?.name || "",
            pool_description: engagementPools[pool]?.description || "",
            updated_at: new Date().toISOString(),
        }
    }

    // Simple rate limiting (no localStorage)
    const checkRateLimit = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const submissions = stored ? JSON.parse(stored) : []
            const now = Date.now()
            const recent = submissions.filter(
                (t) => now - t < RATE_LIMIT_WINDOW
            )
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
            return recent.length < MAX_SUBMISSIONS
        } catch {
            return true
        }
    }

    const recordSubmission = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const submissions = stored ? JSON.parse(stored) : []
            submissions.push(Date.now())
            localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
        } catch {}
    }

    const getRemainingTime = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const submissions = stored ? JSON.parse(stored) : []
            const now = Date.now()
            const within = submissions.filter(
                (t) => now - t < RATE_LIMIT_WINDOW
            )
            if (within.length === 0) return 0
            const oldest = Math.min(...within)
            return Math.max(
                0,
                Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 60000)
            )
        } catch {
            return 0
        }
    }

    const updateFormData = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (errors[field])
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        if (rateLimitError) setRateLimitError("")
    }

    // Validation
    const validateEmail = (email) => {
        if (!email || typeof email !== "string") return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email.trim())
    }
    const validatePhone = (phone) => {
        if (!phone || typeof phone !== "string") return false
        const clean = phone.replace(/\s/g, "")
        const phoneRegex = /^[0-9+\-\s\(\)]{10,15}$/
        return phoneRegex.test(clean) && clean.length >= 10
    }
    const validateYear = (year) => {
        if (!year) return false
        const currentYear = new Date().getFullYear()
        const num = parseInt(year)
        return !isNaN(num) && num >= 1990 && num <= currentYear - 10
    }
    const validateSatScore = (score) => {
        if (!score && score !== 0) return true
        const num = parseInt(score)
        return !isNaN(num) && num >= 400 && num <= 1600
    }
    const validateStep = (step) => {
        const newErrors = {}
        switch (step) {
            case 1:
                if (!formData.satTestStatus)
                    newErrors.satTestStatus = "Vui lòng chọn tình trạng thi SAT"
                if (formData.satScore && !validateSatScore(formData.satScore))
                    newErrors.satScore = "Điểm SAT phải từ 400 đến 1600"
                break
            case 2:
                if (!formData.testDate)
                    newErrors.testDate = "Vui lòng chọn thời gian thi"
                break
            case 3:
                if (!formData.fullName?.trim())
                    newErrors.fullName = "Vui lòng nhập họ tên"
                if (!formData.birthYear)
                    newErrors.birthYear = "Vui lòng nhập năm sinh"
                else if (!validateYear(formData.birthYear))
                    newErrors.birthYear = "Năm sinh không hợp lệ"
                if (!formData.email?.trim())
                    newErrors.email = "Vui lòng nhập email"
                else if (!validateEmail(formData.email))
                    newErrors.email = "Email không hợp lệ"
                break
            case 4:
                if (!formData.phone?.trim())
                    newErrors.phone = "Vui lòng nhập số điện thoại"
                else if (!validatePhone(formData.phone))
                    newErrors.phone = "Số điện thoại không hợp lệ"
                if (!formData.facebookLink?.trim())
                    newErrors.facebookLink = "Vui lòng nhập link Facebook"
                else if (!formData.facebookLink.includes("facebook.com"))
                    newErrors.facebookLink = "Link Facebook không hợp lệ"
                break
            case 5:
                if (!formData.discoverySources || formData.discoverySources.length === 0)
                    newErrors.discoverySources = "Vui lòng chọn ít nhất một nguồn thông tin"
                if (
                    formData.discoverySources.includes("Khác") &&
                    !formData.customDiscoverySource?.trim()
                )
                    newErrors.customDiscoverySource = "Vui lòng nhập nguồn thông tin khác"
                break
            case 6:
                // Only validate course if user has taken SAT
                if (formData.satTestStatus === "taken" && !formData.course)
                    newErrors.course = "Vui lòng chọn khóa học"
                break
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Determine recommended course based on SAT score and test timeline
    const getRecommendedCourse = () => {
        const score = formData.satScore || 1000
        const timeline = formData.testDate
        
        // Classify score level
        let scoreLevel = "Mid"
        if (score < 1051) {
            scoreLevel = "Low"
        } else if (score >= 1051 && score <= 1300) {
            scoreLevel = "Mid"
        } else if (score > 1300) {
            scoreLevel = "High"
        }
        
        // Match course based on timeline and score
        if (timeline === "Trong 3 tháng tới") { // Intensive (0-3 months)
            if (scoreLevel === "High") return "SAT Sprint"
            if (scoreLevel === "Mid") return "SAT Beginner"
            if (scoreLevel === "Low") return "SAT Beginner"
        } else if (timeline === "Trong 3 - 6 tháng tới") { // Standard (3-6 months)
            if (scoreLevel === "High") return "SAT Sprint"
            if (scoreLevel === "Mid") return "SAT Beginner"
            if (scoreLevel === "Low") return "Pre-SAT"
        } else if (timeline === "Sau 6 tháng") { // Foundation (6+ months)
            if (scoreLevel === "High") return "SAT Beginner"
            if (scoreLevel === "Mid") return "Pre-SAT"
            if (scoreLevel === "Low") return "Pre-SAT"
        }
        
        // Default fallback
        return "SAT Beginner"
    }
    
    const recommendedCourse = getRecommendedCourse()

    // Options (mirrored)
    const courseOptions = [
        {
            value: "Pre-SAT",
            label: "Khóa Pre-SAT",
            desc: "Đầu ra 1100+, nắm được toàn bộ kiến thức cơ bản về SAT",
            requirement: "Không yêu cầu đầu vào",
        },
        {
            value: "SAT Beginner",
            label: "Khóa SAT Beginner",
            desc: "Đầu ra 1300-1400, tổng ôn kiến thức trọng tâm, có thể xét tuyển đại học",
            requirement: "Yêu cầu đầu vào 1100+",
        },
        {
            value: "SAT Sprint",
            label: "Khóa SAT Sprint",
            desc: "Đầu ra 1450+, tập trung vào giải đề, có thể xét tuyển đại học và nộp hồ sơ du học",
            requirement: "Yêu cầu đầu vào 1350+",
        },
        {
            value: "SAT 1-1",
            label: "Khóa SAT 1 kèm 1",
            desc: "Lộ trình học cá nhân hóa nhằm đạt điểm SAT mục tiêu trong thời gian ngắn nhất",
            requirement: "Không yêu cầu đầu vào",
        },
    ]
    // removed scheduleOptions
    const discoveryOptions = [
        "Facebook QAS Academy",
        "Instagram QAS Academy",
        "Thread QAS Academy",
        "Tiktok QAS Academy",
        "Social media của Quốc An",
        "Dự án, sự kiện, câu lạc bộ, tổ chức",
        "Phụ huynh giới thiệu",
        "Học viên giới thiệu",
        "Comment của tư vấn viên",
        "Khác",
    ]
    
    const toggleDiscoverySource = (source) => {
        const sources = formData.discoverySources || []
        if (sources.includes(source)) {
            updateFormData(
                "discoverySources",
                sources.filter((s) => s !== source)
            )
        } else {
            updateFormData("discoverySources", [...sources, source])
        }
    }
    // removed contact method choices & country change handler & handleLearningPurposeChange

    // Simple submit function
    const submitForm = async () => {
        if (isSubmitting) return
        if (!validateStep(6)) return
        if (!checkRateLimit()) {
            const mins = getRemainingTime()
            setRateLimitError(
                `Bạn đã gửi quá nhiều biểu mẫu. Vui lòng thử lại sau ${mins} phút.`
            )
            return
        }

        setIsSubmitting(true)
        setRateLimitError("")

        const submissionData = prepareSubmissionData(formData, true)

        try {
            console.log("Submitting form data:", submissionData)

            // Submit to Supabase
            const supabaseResponse = await fetch(
                `${supabaseUrl}/rest/v1/qas_registrations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                        Prefer: "return=minimal",
                    },
                    body: JSON.stringify({
                        ...submissionData,
                        created_at: new Date().toISOString(),
                    }),
                }
            )

            console.log("Supabase response status:", supabaseResponse.status)

            if (!supabaseResponse.ok) {
                const errorText = await supabaseResponse.text()
                console.error("Supabase error response:", errorText)
                throw new Error(
                    `Supabase request failed: ${supabaseResponse.status} - ${errorText}`
                )
            }

            // Send to N8N webhook (optional, don't fail if this fails)
            try {
                const n8nResponse = await fetch(
                    `${n8nUrl}/webhook/90dc17a4-8930-4a5a-a473-457d99044e33`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...submissionData,
                            submission_type: "completed",
                        }),
                    }
                )

                if (!n8nResponse.ok) {
                    console.warn(
                        "N8N webhook failed, but continuing since Supabase succeeded"
                    )
                } else {
                    console.log("N8N webhook success")
                }
            } catch (webhookError) {
                console.error("N8N webhook error:", webhookError)
                // Don't throw error for N8N failure since Supabase succeeded
            }

            recordSubmission()
            setSubmitSuccess(true)
        } catch (error) {
            console.error("Submission error:", error)
            alert("Có lỗi xảy ra. Vui lòng thử lại!")
        } finally {
            setIsSubmitting(false)
        }
    }

    const nextStep = () => {
        if (!validateStep(currentStep)) return
        
        // Auto-select recommended course when entering Step 6 (for taken SAT users)
        if (currentStep === 5 && formData.satTestStatus === "taken" && !formData.course) {
            updateFormData("course", recommendedCourse)
        }
        
        // If at step 6 and user has taken SAT, go to step 7
        // If at step 6 and user has NOT taken SAT, skip to step 7 (which won't be shown, will submit directly)
        if (currentStep === 6 && formData.satTestStatus === "taken") {
            setCurrentStep(7)
        } else if (currentStep < 6) {
            setCurrentStep(currentStep + 1)
        }
    }
    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const startNewForm = () => {
        setFormData({
            satTestStatus: "",
            satScore: 1000,
            testDate: "",
            targetScore: 1400,
            fullName: "",
            birthYear: "",
            email: "",
            phone: "",
            facebookLink: "",
            discoverySources: [],
            customDiscoverySource: "",
            course: "",
        })
        setCurrentStep(1)
        setSubmitSuccess(false)
        setErrors({})
        setRateLimitError("")
    }

    // UI helpers
    const PoolBadge = ({ pool }) => {
        if (!pool) return null
        const meta = engagementPools[pool] || {}
        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "#f3f4f6",
                    color: "#111827",
                    border: `1px solid #e5e7eb`,
                }}
            >
                <span style={{ fontSize: 16 }}>{meta.icon || ""}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {meta.name || pool}
                </span>
            </div>
        )
    }

    if (submitSuccess) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    minHeight: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 20px",
                    background: "white",
                    marginTop: 60,
                }}
            >
                <motion.div
                    style={{
                        background: "white",
                        borderRadius: "20px",
                        padding: "60px",
                        textAlign: "center",
                        maxWidth: "600px",
                        width: "100%",
                        boxShadow: "0 20px 40px rgba(0,74,173,0.1)",
                        border: "1px solid #e5e5e5",
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Paper Plane Icon */}
                    <motion.div
                        style={{
                            display: "inline-block",
                            marginBottom: "32px",
                        }}
                        initial={{ rotate: -20, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                    >
                        <svg
                            width={isMobile ? "120" : "150"}
                            height={isMobile ? "120" : "150"}
                            viewBox="0 0 200 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect x="50" y="70" width="100" height="70" rx="6" fill="#FFD54F"/>
                          <path d="M 50 70 L 100 110 L 150 70" stroke="#FFA000" strokeWidth="3" fill="none"/>
                          <path d="M 120 40 L 180 70 L 140 85 L 130 120 Z" fill="#42A5F5" stroke="#1976D2" strokeWidth="2"/>
                          <path d="M 140 85 L 180 70 L 130 120" fill="#64B5F6" stroke="#1976D2" strokeWidth="2"/>
                          <circle cx="40" cy="50" r="3" fill="#FFD54F"/>
                          <circle cx="170" cy="130" r="3" fill="#FFD54F"/>
                          <path d="M 160 45 L 162 50 L 167 50 L 163 53 L 165 58 L 160 55 L 155 58 L 157 53 L 153 50 L 158 50 Z" fill="#FFD54F"/>
                          <path d="M 115 45 Q 105 55 95 60" stroke="#90CAF9" strokeWidth="2" strokeDasharray="5,5" strokeLinecap="round" fill="none"/>
                        </svg>
                    </motion.div>

                    <motion.h1
                        style={{
                            color: "#2D3A62",
                            fontSize: isMobile ? "28px" : "36px",
                            marginBottom: "16px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        GỬI THÀNH CÔNG!
                    </motion.h1>
                    
                    <motion.p
                        style={{
                            color: "#2D3A62",
                            fontSize: isMobile ? "15px" : "17px",
                            lineHeight: "1.6",
                            marginBottom: "32px",
                            fontWeight: "500",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        Cảm ơn bạn đã đăng ký học thử tại QAS Academy.
                        <br />
                        Chúng mình đã nhận được thông tin và sẽ sớm liên hệ với bạn!
                    </motion.p>

                        <motion.button
                            onClick={() =>
                                window.open(
                                    "https://www.facebook.com/messages/t/108905614033440",
                                    "_blank"
                                )
                            }
                            style={{
                            background: "#004AAD",
                                color: "white",
                                border: "none",
                            padding: isMobile ? "16px 32px" : "18px 40px",
                                borderRadius: "12px",
                            fontSize: isMobile ? "15px" : "16px",
                            fontWeight: "700",
                                cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            marginBottom: "40px",
                            boxShadow: "0 4px 12px rgba(0,74,173,0.3)",
                        }}
                        whileHover={{ scale: 1.05, boxShadow: "0 6px 16px rgba(0,74,173,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                        Nhắn tin xác nhận cho Fanpage QAS ngay!
                    </motion.button>

                    <div
                        style={{
                            height: "1px",
                            background: "#E8F3FF",
                            marginBottom: "32px",
                        }}
                    />

                    <motion.div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: isMobile ? "16px" : "20px",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <motion.a
                            href="https://www.facebook.com/qasacademy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                width: isMobile ? "44px" : "48px",
                                height: isMobile ? "44px" : "48px",
                                background: "#1877F2",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                textDecoration: "none",
                            }}
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </motion.a>

                        <motion.a
                            href="https://www.instagram.com/qasacademy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                width: isMobile ? "44px" : "48px",
                                height: isMobile ? "44px" : "48px",
                                background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                textDecoration: "none",
                            }}
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                        </motion.a>

                        <motion.a
                            href="https://www.tiktok.com/@qasacademy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                width: isMobile ? "44px" : "48px",
                                height: isMobile ? "44px" : "48px",
                                background: "#000000",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                textDecoration: "none",
                            }}
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                        </motion.a>

                        <motion.a
                            href="https://www.threads.net/@qasacademy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                width: isMobile ? "44px" : "48px",
                                height: isMobile ? "44px" : "48px",
                                background: "#000000",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                textDecoration: "none",
                            }}
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 1.623-.015 3.027-.314 4.176-.891.73-.367 1.339-.812 1.808-1.322.298-.324.527-.67.684-1.03.124-.287.186-.57.186-.848 0-.256-.062-.486-.184-.702a1.724 1.724 0 0 0-.5-.577 2.01 2.01 0 0 0-.732-.38 3.465 3.465 0 0 0-.919-.123c-.396 0-.774.062-1.128.184-.354.123-.671.296-.948.519a2.91 2.91 0 0 0-.673.766 2.23 2.23 0 0 0-.262.988c0 .396.093.75.279 1.064.186.313.443.577.773.793.33.215.716.377 1.159.485.442.108.92.163 1.433.163.843 0 1.613-.146 2.31-.437a5.44 5.44 0 0 0 1.808-1.215c.509-.521.906-1.142 1.193-1.861.287-.72.43-1.507.43-2.362 0-1.213-.287-2.3-.862-3.26a6.185 6.185 0 0 0-2.34-2.197c-1.006-.547-2.155-.82-3.447-.82-1.292 0-2.441.273-3.447.82a6.185 6.185 0 0 0-2.34 2.197c-.575.96-.862 2.047-.862 3.26 0 .73.108 1.406.324 2.027.215.621.527 1.157.935 1.608.408.451.906.804 1.495 1.058.588.255 1.249.382 1.982.382.843 0 1.613-.146 2.31-.437a5.44 5.44 0 0 0 1.808-1.215c.509-.521.906-1.142 1.193-1.861.287-.72.43-1.507.43-2.362 0-.855-.143-1.642-.43-2.362a5.956 5.956 0 0 0-1.193-1.861 5.44 5.44 0 0 0-1.808-1.215c-.697-.291-1.467-.437-2.31-.437-.732 0-1.394.127-1.982.382-.589.254-1.087.607-1.495 1.058a4.906 4.906 0 0 0-.935 1.608 5.858 5.858 0 0 0-.324 2.027c0 1.213.287 2.3.862 3.26a6.185 6.185 0 0 0 2.34 2.197c1.006.547 2.155.82 3.447.82 1.292 0 2.441-.273 3.447-.82a6.185 6.185 0 0 0 2.34-2.197c.575-.96.862-2.047.862-3.26z"/>
                            </svg>
                        </motion.a>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    return (
        <>
        <style>{`
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            height: 8px;
          }
          
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #004AAD;
            cursor: pointer;
            border: 4px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            margin-top: -8px;
            position: relative;
            z-index: 2;
          }
          
          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #004AAD;
            cursor: pointer;
            border: 4px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
          }
          
          input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 8px;
            cursor: pointer;
            border-radius: 4px;
            background: transparent;
          }
          
          input[type="range"]::-moz-range-track {
            width: 100%;
            height: 8px;
            cursor: pointer;
            border-radius: 4px;
            background: transparent;
          }
          
          input[type="range"]::-moz-range-progress {
            background: #004AAD;
            height: 8px;
            border-radius: 4px;
          }
        `}</style>
        <div
      ref={containerRef}
      style={{
        ...style,
        width: "100%",
        marginTop: 60,
        minHeight: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.container,
        background: "white",
      }}
    >
      <motion.div
        style={{
          background: "white",
          borderRadius: isMobile ? "16px" : "20px",
          width: "100%",
          maxWidth: isMobile ? "100%" : isTablet ? "700px" : "1000px",
          boxShadow: isMobile ? "0 8px 24px rgba(0,74,173,0.08)" : "0 20px 60px rgba(0,74,173,0.1)",
          border: "1px solid #e5e5e5",
          overflow: "hidden",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? "32px 20px" : isTablet ? "40px 32px" : "48px 40px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? "28px" : isTablet ? "32px" : "36px",
              margin: "0 0 16px 0",
              fontWeight: "700",
              lineHeight: "1.2",
              color: "#2D3A62",
            }}
          >
            ĐĂNG KÝ HỌC THỬ SAT MIỄN PHÍ
          </h1>
          <div
            style={{
              margin: "0",
              fontSize: fontSize.subtitle,
              lineHeight: "1.6",
              color: "#2D3A62",
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <span style={{ color: "#DF2A31", fontWeight: "700" }}>QAS Academy</span> là trung tâm luyện thi SAT từ năm
            2021. Với hơn 03 năm hoạt động, chúng mình đã giúp trên{" "}
            <span style={{ color: "#004AAD", fontWeight: "700" }}>200 học viên</span> đạt mục tiêu lên đến 1600 SAT,
            hiện thực hóa <span style={{ color: "#004AAD", fontWeight: "700" }}>"giấc mơ Mỹ"</span> của nhiều bạn trẻ
            cũng như giúp nhiều sĩ tử vào được cánh cổng đại học mơ ước của mình như{" "}
            <span style={{ color: "#004AAD", fontWeight: "700" }}>FTU, NEU, HUST, ĐAV,...</span>
          </div>
        </div>

        {/* Progress & Steps */}
        <div
          style={{
            padding: isMobile ? "24px 20px 16px 20px" : isTablet ? "32px 32px 20px 32px" : "40px 40px 20px 40px",
          }}
        >
          <div
            style={{
              marginBottom: isMobile ? "24px" : isTablet ? "32px" : "40px",
              width: "100%",
            }}
          >
            {/* Progress Dashes */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "8px" : "12px",
                marginBottom: isMobile ? "16px" : "20px",
              }}
            >
               {/* Show 6 steps for "never" (not taken SAT), 7 steps for "taken" */}
               {(formData.satTestStatus === "taken" ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6]).map((step) => (
                <div
                  key={step}
                  style={{
                    width: formData.satTestStatus === "taken" 
                      ? (isMobile ? "50px" : isTablet ? "70px" : "85px")
                      : (isMobile ? "60px" : isTablet ? "80px" : "100px"),
                    height: isMobile ? "4px" : "6px",
                    borderRadius: "3px",
                    background: step <= currentStep ? "#004AAD" : "#e5e5e5",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Form Content Container */}
          <div
            style={{
              background: "#F5FBFE",
              borderRadius: isMobile ? "12px" : "16px",
              padding: isMobile ? "24px 20px" : isTablet ? "32px 28px" : "40px 36px",
              border: "1px solid #A1D0F4",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                style={{
                  minHeight: "auto",
                }}
              >
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width={isMobile ? "18" : "22"}
                          height={isMobile ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <h2
                        style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        Tình trạng thi SAT
                      </h2>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />

                    <div
                      style={{
                        marginBottom: isMobile ? "32px" : isTablet ? "40px" : "48px",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          marginBottom: isMobile ? "16px" : "20px",
                          fontWeight: "600",
                          color: "#2D3A62",
                          fontSize: fontSize.body,
                        }}
                      >
                        Bạn đã từng thi SAT hoặc làm bài thi thử SAT trước đây chưa?{" "}
                        <span style={{ color: "#DF2A31" }}>*</span>
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gap: isMobile ? "12px" : isTablet ? "16px" : "20px",
                          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        }}
                      >
                        <motion.div
                          onClick={() => updateFormData("satTestStatus", "taken")}
                          style={{
                            padding: isMobile ? "20px" : isTablet ? "24px" : "28px",
                            border: formData.satTestStatus === "taken" ? "2px solid #004AAD" : "2px solid #e5e5e5",
                            borderRadius: isMobile ? "12px" : "16px",
                            cursor: "pointer",
                            background: formData.satTestStatus === "taken" ? "#D6E9FF" : "white",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#2D3A62",
                            fontSize: fontSize.body,
                          }}
                          whileHover={{
                            scale: isMobile ? 1.01 : 1.02,
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Mình đã từng thi SAT rồi
                        </motion.div>
                        <motion.div
                          onClick={() => updateFormData("satTestStatus", "never")}
                          style={{
                            padding: isMobile ? "20px" : isTablet ? "24px" : "28px",
                            border: formData.satTestStatus === "never" ? "2px solid #004AAD" : "2px solid #e5e5e5",
                            borderRadius: isMobile ? "12px" : "16px",
                            cursor: "pointer",
                            background: formData.satTestStatus === "never" ? "#D6E9FF" : "white",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#2D3A62",
                            fontSize: fontSize.body,
                          }}
                          whileHover={{
                            scale: isMobile ? 1.01 : 1.02,
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Mình chưa thi SAT lần nào
                        </motion.div>
                      </div>
                      {errors.satTestStatus && (
                        <div
                          style={{
                            color: "#DF2A31",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.satTestStatus}
                        </div>
                      )}
                    </div>

                    {formData.satTestStatus === "taken" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: "20px" }}
                      >
                        <label
                          style={{
                            display: "block",
                            marginBottom: "16px",
                            fontWeight: "600",
                            color: "#2D3A62",
                            fontSize: fontSize.body,
                          }}
                        >
                          Điểm SAT gần nhất bạn đạt được: {formData.satScore}
                        </label>
                        <div style={{ position: "relative", marginBottom: "16px" }}>
                          <input
                            type="range"
                            min="400"
                            max="1600"
                            step="50"
                            value={formData.satScore}
                            onChange={(e) => updateFormData("satScore", Number.parseInt(e.target.value))}
                            style={{
                              width: "100%",
                              height: "8px",
                              borderRadius: "4px",
                              background: `linear-gradient(to right, #004AAD 0%, #004AAD ${((formData.satScore - 400) / (1600 - 400)) * 100}%, #e5e5e5 ${((formData.satScore - 400) / (1600 - 400)) * 100}%, #e5e5e5 100%)`,
                              outline: "none",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            color: "#666",
                            fontWeight: "600",
                          }}
                        >
                          <span>400</span>
                          <span>1600</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                 {/* Step 2: Exam Plan */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width={isMobile ? "18" : "22"}
                          height={isMobile ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <h2
                              style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                                fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                              }}
                            >
                        Thời gian thi SAT dự kiến
                      </h2>
                            </div>

                    {/* Divider */}
                            <div
                              style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />

                        <div
                          style={{
                        marginBottom: isMobile ? "20px" : isTablet ? "24px" : "30px",
                          }}
                        >
                      <label
                        style={{
                          display: "block",
                           marginBottom: isMobile ? "12px" : "16px",
                           fontWeight: 600,
                          color: "#333",
                          fontSize: fontSize.body,
                        }}
                      >
                         Bạn dự kiến thi SAT khi nào? <span style={{ color: "#DF2A31" }}>*</span>
                      </label>
                      <div
                        style={{
                          display: "grid",
                           gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                           gap: isMobile ? "10px" : "12px",
                           marginBottom: "16px",
                        }}
                      >
                         {["Trong 3 tháng tới", "Trong 3 - 6 tháng tới", "Sau 6 tháng"].map((opt) => (
                          <motion.div
                             key={opt}
                             onClick={() => updateFormData("testDate", opt)}
                          style={{
                               padding: isMobile ? "14px" : "16px",
                               border: formData.testDate === opt ? "2px solid #004AAD" : "2px solid #e5e5e5",
                               borderRadius: isMobile ? "10px" : "12px",
                              cursor: "pointer",
                               background: formData.testDate === opt ? "#D6E9FF" : "white",
                               textAlign: "center",
                               fontWeight: 600,
                               color: "#2D3A62",
                            }}
                             whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                             {opt}
                          </motion.div>
                        ))}
                        </div>
                       {errors.testDate && (
                         <div style={{ color: "#dc2626", fontSize: 14, marginTop: 8 }}>{errors.testDate}</div>
                      )}
                       <div style={{ marginTop: 20 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                             fontWeight: 600,
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                           Điểm SAT mong muốn: {formData.targetScore}
                      </label>
                      <input
                           type="range"
                           min="1200"
                           max="1600"
                           step="50"
                           value={formData.targetScore}
                           onChange={(e) => updateFormData("targetScore", Number.parseInt(e.target.value))}
                        style={{
                          width: "100%",
                             height: "8px",
                             borderRadius: "4px",
                             background: `linear-gradient(to right, #004AAD 0%, #004AAD ${((formData.targetScore - 1200) / (1600 - 1200)) * 100}%, #e5e5e5 ${((formData.targetScore - 1200) / (1600 - 1200)) * 100}%, #e5e5e5 100%)`,
                           }}
                         />
                         <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#666", fontWeight: 600, marginTop: 8 }}>
                           <span>1200</span>
                           <span>1600</span>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Personal Info - Part 1 */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                    <div
                      style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width={isMobile ? "18" : "22"}
                          height={isMobile ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <h2
                            style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        Thông tin cá nhân
                      </h2>
                          </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />
                    <div style={{ marginBottom: "25px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "12px",
                            fontWeight: "600",
                            color: "#333",
                            fontSize: "16px",
                          }}
                        >
                        Họ tên *
                        </label>
                        <input
                          type="text"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                          style={{
                            width: "100%",
                            padding: "16px",
                          border: errors.fullName ? "2px solid #dc2626" : "2px solid #e5e5e5",
                            borderRadius: "12px",
                            fontSize: "16px",
                          }}
                        />
                      {errors.fullName && (
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "14px",
                              marginTop: "8px",
                            }}
                          >
                          {errors.fullName}
                          </div>
                        )}
                    </div>
                    <div style={{ marginBottom: "25px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                        Năm sinh *
                      </label>
                      <input
                        type="number"
                        value={formData.birthYear}
                        onChange={(e) => updateFormData("birthYear", e.target.value)}
                        placeholder="Ví dụ: 2005"
                        min="1990"
                        max="2015"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: errors.birthYear ? "2px solid #dc2626" : "2px solid #e5e5e5",
                          borderRadius: "12px",
                          fontSize: "16px",
                        }}
                      />
                      {errors.birthYear && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.birthYear}
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: "25px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                        Địa chỉ Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="example@gmail.com"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: errors.email ? "2px solid #dc2626" : "2px solid #e5e5e5",
                          borderRadius: "12px",
                          fontSize: "16px",
                        }}
                      />
                      {errors.email && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Personal Info - Part 2 */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width={isMobile ? "18" : "22"}
                          height={isMobile ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <h2
                        style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        Thông tin cá nhân
                      </h2>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />
                    <div style={{ marginBottom: "25px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        placeholder="0123456789 hoặc +84123456789"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: errors.phone ? "2px solid #dc2626" : "2px solid #e5e5e5",
                          borderRadius: "12px",
                          fontSize: "16px",
                        }}
                      />
                      {errors.phone && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.phone}
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                        Link Facebook *
                      </label>
                      <input
                        type="url"
                        value={formData.facebookLink}
                        onChange={(e) => updateFormData("facebookLink", e.target.value)}
                        placeholder="https://facebook.com/username"
                        style={{
                          width: "100%",
                          padding: "16px",
                          border: errors.facebookLink ? "2px solid #dc2626" : "2px solid #e5e5e5",
                          borderRadius: "12px",
                          fontSize: "16px",
                        }}
                      />
                      {errors.facebookLink && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.facebookLink}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Discovery Source - NEW */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width={isMobile ? "18" : "22"}
                          height={isMobile ? "18" : "22"}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <h2
                        style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        Thông tin cá nhân
                      </h2>
                    </div>

                    {/* Divider */}
                        <div
                          style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />

                    <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            display: "block",
                          marginBottom: isMobile ? "12px" : "16px",
                            fontWeight: "600",
                          color: "#2D3A62",
                          fontSize: fontSize.body,
                          }}
                        >
                        Bạn biết đến QAS Academy qua đâu? <span style={{ color: "#DF2A31" }}>*</span>
                        </label>
                      <p style={{ fontSize: "14px", color: "#666", fontStyle: "italic", marginBottom: "16px" }}>
                        (Có thể lựa chọn nhiều phương án)
                      </p>
                          <div
                            style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                      >
                        {discoveryOptions.map((option) => (
                      <label
                            key={option}
                        style={{
                              display: "flex",
                              alignItems: "flex-start",
                              cursor: "pointer",
                            }}
                          >
                        <input
                              type="checkbox"
                              checked={formData.discoverySources?.includes(option) || false}
                              onChange={() => toggleDiscoverySource(option)}
                          style={{
                                width: "20px",
                                height: "20px",
                                marginRight: "12px",
                                marginTop: "2px",
                                cursor: "pointer",
                                accentColor: "#004AAD",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: "16px", color: "#333", lineHeight: "1.5" }}>{option}</span>
                      </label>
                        ))}
                      </div>
                      {errors.discoverySources && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                          {errors.discoverySources}
                        </div>
                      )}
                    </div>
                    {formData.discoverySources?.includes("Khác") && (
                    <div style={{ marginBottom: "25px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "12px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                          Nguồn thông tin khác *
                      </label>
                      <input
                        type="text"
                          value={formData.customDiscoverySource}
                          onChange={(e) => updateFormData("customDiscoverySource", e.target.value)}
                          placeholder="Nhập nguồn thông tin khác"
                        style={{
                          width: "100%",
                          padding: "16px",
                            border: errors.customDiscoverySource ? "2px solid #dc2626" : "2px solid #e5e5e5",
                          borderRadius: "12px",
                          fontSize: "16px",
                        }}
                      />
                        {errors.customDiscoverySource && (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                            marginTop: "8px",
                          }}
                        >
                            {errors.customDiscoverySource}
                        </div>
                      )}
                    </div>
                    )}
                  </motion.div>
                )}

                {/* Step 6: Course Selection (if taken SAT) or Confirmation (if not taken) */}
                {currentStep === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                        style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src="https://xdjnxagkgpvtmitbskzg.supabase.co/storage/v1/object/public/icons/white/book-open.png"
                          alt="Book icon"
                          style={{
                            width: isMobile ? "18px" : "22px",
                            height: isMobile ? "18px" : "22px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <h2
                        style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        {formData.satTestStatus === "taken" ? "Lựa chọn khóa học mong muốn" : "Hoàn thiện đăng ký"}
                      </h2>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />
                    
                    {formData.satTestStatus === "taken" ? (
                      /* Course Selection - Show only for "taken" */
                      <div
                        style={{
                          marginBottom: isMobile ? "20px" : isTablet ? "24px" : "30px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: isMobile ? "12px" : isTablet ? "14px" : "16px",
                            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
                          }}
                        >
                          {courseOptions.map((option) => {
                            const isRecommended = option.value === recommendedCourse
                            const isSelected = formData.course === option.value
                            
                            return (
                              <motion.div
                                key={option.value}
                                onClick={() => updateFormData("course", option.value)}
                                style={{
                                  padding: isMobile ? "16px" : isTablet ? "18px" : "20px",
                                  border: isRecommended 
                                    ? "2px solid #004AAD" 
                                    : (isSelected ? "2px solid #004AAD" : "2px solid #e5e5e5"),
                                  borderRadius: isMobile ? "8px" : "12px",
                                  cursor: "pointer",
                                  background: isSelected ? "#D6E9FF" : "white",
                                  position: "relative",
                                  overflow: "visible",
                                }}
                                whileHover={{
                                  scale: isMobile ? 1.01 : 1.02,
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {/* Recommended Badge */}
                                {isRecommended && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "-12px",
                                      right: isMobile ? "12px" : "16px",
                                      background: "#DF2A31",
                                      color: "white",
                                      padding: "6px 16px",
                                      borderRadius: "20px",
                                      fontSize: isMobile ? "11px" : "12px",
                                      fontWeight: "700",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      boxShadow: "0 2px 8px rgba(223, 42, 49, 0.3)",
                                      zIndex: 1,
                                    }}
                                  >
                                    Recommended
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" fill="none"/>
                                    </svg>
                                  </div>
                                )}
                                
                                <div
                                  style={{
                                    fontWeight: "700",
                                    color: "#2D3A62",
                                    marginBottom: "8px",
                                    fontSize: isMobile ? "16px" : "18px",
                                    marginTop: isRecommended ? "8px" : "0",
                                  }}
                                >
                                  {option.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? "13px" : "14px",
                                    color: "#666",
                                    marginBottom: "8px",
                                    lineHeight: "1.5",
                                  }}
                                >
                                  {option.desc}
                                </div>
                                <div
                                  style={{
                                    fontSize: isMobile ? "12px" : "13px",
                                    color: "#999",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {option.requirement}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                        {errors.course && (
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "14px",
                              marginTop: "8px",
                            }}
                          >
                            {errors.course}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Confirmation Content - Show for "not_taken" */
                      <>
                        <div
                          style={{
                            background: "#F5FBFE",
                            borderRadius: "12px",
                            padding: isMobile ? "20px" : "24px",
                            marginBottom: "24px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "24px",
                              paddingBottom: "24px",
                              borderBottom: "1px solid #e5e5e5",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: isMobile ? "18px" : "20px",
                                fontWeight: "700",
                                color: "#2D3A62",
                                margin: "0",
                                textTransform: "uppercase",
                              }}
                            >
                              {formData.fullName || ""}
                            </h3>
                            <div
                              style={{
                                width: isMobile ? "32px" : "40px",
                                height: isMobile ? "32px" : "40px",
                                background: "#004AAD",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width={isMobile ? "16" : "20"}
                                height={isMobile ? "16" : "20"}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  fill="white"
                                />
                              </svg>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#666",
                              }}
                            >
                              Thông tin liên hệ
                            </span>
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#2D3A62",
                              }}
                            >
                              {formData.phone || ""}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#FFF9E6",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #FFD700",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#2D3A62",
                              lineHeight: "1.6",
                              marginBottom: "16px",
                              fontWeight: "600",
                            }}
                          >
                            Trong vòng 24 giờ, chúng mình sẽ liên hệ với bạn qua Zalo/Facebook để:
                          </p>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            <li
                              style={{
                                fontSize: "14px",
                                color: "#2D3A62",
                                marginBottom: "12px",
                                paddingLeft: "24px",
                                position: "relative",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  color: "#004AAD",
                                  fontWeight: "bold",
                                }}
                              >
                                •
                              </span>
                              Sắp xếp lịch thi thử SAT
                            </li>
                            <li
                              style={{
                                fontSize: "14px",
                                color: "#2D3A62",
                                marginBottom: "12px",
                                paddingLeft: "24px",
                                position: "relative",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  color: "#004AAD",
                                  fontWeight: "bold",
                                }}
                              >
                                •
                              </span>
                              Tư vấn lộ trình học phù hợp dựa trên kết quả bài thi và thời gian thi dự kiến
                            </li>
                            <li
                              style={{
                                fontSize: "14px",
                                color: "#2D3A62",
                                paddingLeft: "24px",
                                position: "relative",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  color: "#004AAD",
                                  fontWeight: "bold",
                                }}
                              >
                                •
                              </span>
                              Cung cấp thêm thông tin chi tiết về chương trình học
                            </li>
                          </ul>
                        </div>
                      </>
                    )}
                    {rateLimitError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          marginTop: "20px",
                          padding: "16px",
                          background: "#fef2f2",
                          border: "2px solid #fecaca",
                          borderRadius: "12px",
                          color: "#dc2626",
                          fontSize: "16px",
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        ⚠️ {rateLimitError}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 7: Confirmation */}
                {currentStep === 7 && (
                  <motion.div
                    key="step7"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "12px" : "16px",
                        marginBottom: isMobile ? "24px" : isTablet ? "28px" : "32px",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? "32px" : "40px",
                          height: isMobile ? "32px" : "40px",
                          background: "#004AAD",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src="https://xdjnxagkgpvtmitbskzg.supabase.co/storage/v1/object/public/icons/white/badge-check.png"
                          alt="Badge check icon"
                          style={{
                            width: isMobile ? "18px" : "22px",
                            height: isMobile ? "18px" : "22px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <h2
                        style={{
                          fontSize: isMobile ? "20px" : isTablet ? "22px" : "24px",
                          fontWeight: "700",
                          color: "#2D3A62",
                          margin: "0",
                        }}
                      >
                        Hoàn thiện đăng ký
                      </h2>
                    </div>

                    {/* Divider */}
                        <div
                          style={{
                        height: "1px",
                        background: "#e5e5e5",
                        marginBottom: isMobile ? "24px" : "32px",
                      }}
                    />

                    {/* Confirmation Content */}
                    <div
                      style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: isMobile ? "24px" : "32px",
                        marginBottom: "24px",
                        border: "2px solid #E8F3FF",
                        boxShadow: "0 2px 8px rgba(0, 74, 173, 0.08)",
                      }}
                    >
                      <div
                          style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "24px",
                          paddingBottom: "24px",
                          borderBottom: "1px solid #E8F3FF",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: isMobile ? "18px" : "20px",
                            fontWeight: "700",
                            color: "#2D3A62",
                            margin: "0",
                            textTransform: "uppercase",
                          }}
                        >
                          {formData.fullName || ""}
                        </h3>
                          <div
                            style={{
                            width: isMobile ? "40px" : "48px",
                            height: isMobile ? "40px" : "48px",
                            background: "#E8F3FF",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width={isMobile ? "20" : "24"}
                            height={isMobile ? "20" : "24"}
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              fill="#004AAD"
                            />
                          </svg>
                          </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: "20px",
                        }}
                      >
                        <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: isMobile ? "14px" : "15px",
                              color: "#2D3A62",
                              fontWeight: "600",
                            }}
                          >
                            Khóa học
                          </span>
                          <span
                            style={{
                          fontSize: isMobile ? "15px" : "16px",
                              fontWeight: "700",
                              color: "#2D3A62",
                            }}
                          >
                            {courseOptions.find(c => c.value === formData.course)?.value || formData.course || ""}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                            fontSize: isMobile ? "14px" : "15px",
                              color: "#2D3A62",
                              fontWeight: "600",
                            }}
                          >
                            Thông tin liên hệ
                          </span>
                          <span
                            style={{
                              fontSize: isMobile ? "15px" : "16px",
                              fontWeight: "700",
                              color: "#2D3A62",
                            }}
                          >
                            {formData.phone || ""}
                          </span>
                        </div>
                    </div>
                    </div>

                    <div
                        style={{
                        background: "#FFF9E6",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #FFD700",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#2D3A62",
                          lineHeight: "1.6",
                          marginBottom: "16px",
                          fontWeight: "600",
                        }}
                      >
                        Trong vòng 24 giờ, chúng mình sẽ liên hệ với bạn qua Zalo/Facebook để:
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        <li
                        style={{
                            fontSize: "14px",
                            color: "#2D3A62",
                            marginBottom: "12px",
                            paddingLeft: "24px",
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              color: "#004AAD",
                              fontWeight: "bold",
                            }}
                          >
                            •
                          </span>
                          Sắp xếp lịch thi thử SAT
                        </li>
                        <li
                          style={{
                            fontSize: "14px",
                            color: "#2D3A62",
                            marginBottom: "12px",
                            paddingLeft: "24px",
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              color: "#004AAD",
                              fontWeight: "bold",
                            }}
                          >
                            •
                          </span>
                          Tư vấn lộ trình học phù hợp dựa trên kết quả bài thi và thời gian thi dự kiến
                        </li>
                        <li
                          style={{
                            fontSize: "14px",
                            color: "#2D3A62",
                            paddingLeft: "24px",
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              color: "#004AAD",
                              fontWeight: "bold",
                            }}
                          >
                            •
                          </span>
                          Cung cấp thêm thông tin chi tiết về chương trình học
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <motion.div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: isMobile ? "24px" : "32px",
                paddingTop: isMobile ? "20px" : "24px",
                borderTop: "1px solid #e5e5e5",
                gap: "16px",
              }}
            >
              <motion.button
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  padding: "14px 28px",
                  border: "none",
                  borderRadius: "12px",
                  background: currentStep === 1 ? "#e5e5e5" : "white",
                  color: currentStep === 1 ? "#999" : "#333",
                  fontWeight: 600,
                  fontSize: "16px",
                  cursor: currentStep === 1 ? "not-allowed" : "pointer",
                  boxShadow: currentStep === 1 ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
                }}
                whileHover={currentStep !== 1 ? { scale: 1.02 } : {}}
                whileTap={currentStep !== 1 ? { scale: 0.98 } : {}}
              >
                Quay lại
              </motion.button>
              {/* Show "Tiếp theo" for step < 6, OR step 6 with "taken" SAT status */}
              {(currentStep < 6 || (currentStep === 6 && formData.satTestStatus === "taken")) ? (
                <motion.button
                  onClick={nextStep}
                  style={{
                    padding: "14px 32px",
                    border: "none",
                    borderRadius: "12px",
                    background: "#004AAD",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tiếp theo
                  <span style={{ fontSize: "18px" }}>→</span>
                </motion.button>
              ) : (
                /* Show "Hoàn tất đăng ký" for step 6 with "not_taken" OR step 7 */
                <motion.button
                  onClick={submitForm}
                  disabled={isSubmitting || !!rateLimitError}
                  style={{
                    padding: "14px 32px",
                    border: "none",
                    borderRadius: "12px",
                    background: isSubmitting || !!rateLimitError ? "#ccc" : "#004AAD",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: isSubmitting || !!rateLimitError ? "not-allowed" : "pointer",
                  }}
                  whileHover={!isSubmitting && !rateLimitError ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting && !rateLimitError ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? "Đang gửi..." : "Hoàn tất đăng ký"}
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
    </>
    )
}

addPropertyControls(QASLeadManagementForm, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "https://gzgebiosasfyzwwkrsof.supabase.co",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Anon Key",
        defaultValue:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z2ViaW9zYXNmeXp3d2tyc29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNTg4NjcsImV4cCI6MjA3NDYzNDg2N30.XNI4MJecZPAK87i8I1pHoiAYBcYNDZcCoEjaikPuA60",
    },
    n8nUrl: {
        type: ControlType.String,
        title: "N8N Webhook URL",
        defaultValue: "https://n8n-280z.onrender.com",
    },
})
