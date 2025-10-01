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
            "schedule",
        ]
        const completedFields = requiredFields.filter(
            (field) => formData[field] && formData[field].trim() !== ""
        )
        score += (completedFields.length / requiredFields.length) * 40

        // Additional data quality points
        if (formData.satScore && parseInt(formData.satScore) > 0) score += 10
        if (formData.birthYear && parseInt(formData.birthYear) > 1990)
            score += 5
        if (formData.school && formData.school.trim() !== "") score += 5
        if (formData.targetScore && parseInt(formData.targetScore) >= 1400)
            score += 10
        if (formData.contactMethods && formData.contactMethods.length > 0)
            score += 5
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
        // Step 1: Course & Schedule
        course: "",
        schedule: "",
        satScore: "",
        voucherCode: "",

        // Step 2: Personal Info
        firstName: "",
        lastName: "",
        birthYear: "",
        email: "",
        phone: "",
        facebookLink: "",

        // Step 3: Location & School
        country: "",
        customCountry: "",
        state: "",
        school: "",

        // Step 4: Preferences & Goals
        discoverySource: "",
        contactMethods: [],
        learningPurpose: "",
        customLearningPurpose: "",
        testDate: "",
        targetScore: 1400,
    })

    // Calculate priority and pool for display (simple calculation)
    const priorityData = calculatePriorityScore(formData)
    const engagementPool = determineEngagementPool(priorityData)

    // Complete country list from the map with Vietnamese names
    const locationData = {
        Canada: {
            states: [
                "Alberta",
                "British Columbia",
                "Manitoba",
                "New Brunswick",
                "Newfoundland and Labrador",
                "Northwest Territories",
                "Nova Scotia",
                "Nunavut",
                "Ontario",
                "Prince Edward Island",
                "Quebec",
                "Saskatchewan",
                "Yukon",
            ],
        },
        "Hoa Kỳ": {
            states: [
                "Alabama",
                "Alaska",
                "Arizona",
                "Arkansas",
                "California",
                "Colorado",
                "Connecticut",
                "Delaware",
                "Florida",
                "Georgia",
                "Hawaii",
                "Idaho",
                "Illinois",
                "Indiana",
                "Iowa",
                "Kansas",
                "Kentucky",
                "Louisiana",
                "Maine",
                "Maryland",
                "Massachusetts",
                "Michigan",
                "Minnesota",
                "Mississippi",
                "Missouri",
                "Montana",
                "Nebraska",
                "Nevada",
                "New Hampshire",
                "New Jersey",
                "New Mexico",
                "New York",
                "North Carolina",
                "North Dakota",
                "Ohio",
                "Oklahoma",
                "Oregon",
                "Pennsylvania",
                "Rhode Island",
                "South Carolina",
                "South Dakota",
                "Tennessee",
                "Texas",
                "Utah",
                "Vermont",
                "Virginia",
                "Washington",
                "West Virginia",
                "Wisconsin",
                "Wyoming",
                "District of Columbia",
            ],
        },
        "Việt Nam": {
            states: [
                "Hà Nội",
                "Hồ Chí Minh",
                "An Giang",
                "Bà Rịa - Vũng Tàu",
                "Bắc Giang",
                "Bắc Kạn",
                "Bạc Liêu",
                "Bắc Ninh",
                "Bến Tre",
                "Bình Định",
                "Bình Dương",
                "Bình Phước",
                "Bình Thuận",
                "Cà Mau",
                "Cao Bằng",
                "Đắk Lắk",
                "Đắk Nông",
                "Điện Biên",
                "Đồng Nai",
                "Đồng Tháp",
                "Gia Lai",
                "Hà Giang",
                "Hà Nam",
                "Hà Tĩnh",
                "Hải Dương",
                "Hậu Giang",
                "Hòa Bình",
                "Hưng Yên",
                "Khánh Hòa",
                "Kiên Giang",
                "Kon Tum",
                "Lai Châu",
                "Lâm Đồng",
                "Lạng Sơn",
                "Lào Cai",
                "Long An",
                "Nam Định",
                "Nghệ An",
                "Ninh Bình",
                "Ninh Thuận",
                "Phú Thọ",
                "Quảng Bình",
                "Quảng Nam",
                "Quảng Ngãi",
                "Quảng Ninh",
                "Quảng Trị",
                "Sóc Trăng",
                "Sơn La",
                "Tây Ninh",
                "Thái Bình",
                "Thái Nguyên",
                "Thanh Hóa",
                "Thừa Thiên Huế",
                "Tiền Giang",
                "Trà Vinh",
                "Tuyên Quang",
                "Vĩnh Long",
                "Vĩnh Phúc",
                "Yên Bái",
                "Phú Yên",
                "Cần Thơ",
                "Đà Nẵng",
                "Hải Phòng",
            ],
        },
        Úc: {
            states: [
                "Australian Capital Territory",
                "New South Wales",
                "Northern Territory",
                "Queensland",
                "South Australia",
                "Tasmania",
                "Victoria",
                "Western Australia",
            ],
        },
    }

    const countries = [
        "Canada",
        "Hoa Kỳ",
        "Vương quốc Anh",
        "Hà Lan",
        "Pháp",
        "Đức",
        "Phần Lan",
        "Nga",
        "Trung Quốc",
        "Hàn Quốc",
        "Việt Nam",
        "Thái Lan",
        "Malaysia",
        "Singapore",
        "Úc",
        "Khác",
    ]

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
            schedule: formData.schedule || "",
            sat_score:
                formData.satScore && formData.satScore.trim() !== ""
                    ? parseInt(formData.satScore)
                    : null,
            voucher_code: formData.voucherCode || "",
            first_name: formData.firstName ? formData.firstName.trim() : "",
            last_name: formData.lastName ? formData.lastName.trim() : "",
            birth_year: formData.birthYear
                ? parseInt(formData.birthYear)
                : null,
            email: formData.email ? formData.email.trim() : "",
            phone: formData.phone ? formData.phone.trim() : "",
            facebook_link: formData.facebookLink || "",
            country:
                formData.country === "Khác"
                    ? formData.customCountry
                        ? formData.customCountry.trim()
                        : ""
                    : formData.country || "",
            state: formData.state ? formData.state.trim() : "",
            school: formData.school ? formData.school.trim() : "",
            discovery_source: formData.discoverySource || "",
            contact_methods: Array.isArray(formData.contactMethods)
                ? formData.contactMethods.join(", ")
                : "",
            learning_purpose:
                formData.learningPurpose === "Other"
                    ? formData.customLearningPurpose
                        ? formData.customLearningPurpose.trim()
                        : ""
                    : formData.learningPurpose || "",
            test_date: formData.testDate || "",
            target_score: formData.targetScore || 1400,
            is_completed: isCompleted,
            is_qualified: !!(
                formData.firstName?.trim() &&
                formData.lastName?.trim() &&
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
                if (!formData.course)
                    newErrors.course = "Vui lòng chọn khóa học"
                if (!formData.schedule)
                    newErrors.schedule = "Vui lòng chọn khung giờ học"
                if (formData.satScore && !validateSatScore(formData.satScore))
                    newErrors.satScore = "Điểm SAT phải từ 400 đến 1600"
                break
            case 2:
                if (!formData.firstName?.trim())
                    newErrors.firstName = "Vui lòng nhập họ"
                if (!formData.lastName?.trim())
                    newErrors.lastName = "Vui lòng nhập tên"
                if (!formData.birthYear)
                    newErrors.birthYear = "Vui lòng nhập năm sinh"
                else if (!validateYear(formData.birthYear))
                    newErrors.birthYear = "Năm sinh không hợp lệ"
                if (!formData.email?.trim())
                    newErrors.email = "Vui lòng nhập email"
                else if (!validateEmail(formData.email))
                    newErrors.email = "Email không hợp lệ"
                if (!formData.phone?.trim())
                    newErrors.phone = "Vui lòng nhập số điện thoại"
                else if (!validatePhone(formData.phone))
                    newErrors.phone = "Số điện thoại không hợp lệ"
                if (
                    formData.facebookLink &&
                    formData.facebookLink.trim() !== "" &&
                    !formData.facebookLink.includes("facebook.com")
                )
                    newErrors.facebookLink = "Link Facebook không hợp lệ"
                break
            case 3:
                if (!formData.country)
                    newErrors.country = "Vui lòng chọn quốc gia"
                if (
                    formData.country === "Khác" &&
                    !formData.customCountry?.trim()
                )
                    newErrors.customCountry = "Vui lòng nhập tên quốc gia"
                if (!formData.state?.trim())
                    newErrors.state = "Vui lòng nhập tỉnh thành / bang"
                if (!formData.school?.trim())
                    newErrors.school = "Vui lòng nhập tên trường"
                if (!formData.discoverySource)
                    newErrors.discoverySource = "Vui lòng chọn nguồn thông tin"
                if (
                    !formData.contactMethods ||
                    formData.contactMethods.length === 0
                )
                    newErrors.contactMethods =
                        "Vui lòng chọn ít nhất một hình thức liên hệ"
                break
            case 4:
                if (!formData.learningPurpose)
                    newErrors.learningPurpose = "Vui lòng chọn mục đích học"
                if (
                    formData.learningPurpose === "Other" &&
                    !formData.customLearningPurpose?.trim()
                )
                    newErrors.customLearningPurpose =
                        "Vui lòng nhập mục đích học"
                if (!formData.testDate)
                    newErrors.testDate = "Vui lòng chọn thời gian thi"
                break
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Options (mirrored)
    const courseOptions = [
        {
            value: "Pre-SAT",
            label: "Khóa Pre-SAT",
            desc: "Đầu ra 1100+, nắm được toàn bộ kiến thức cơ bản về SAT",
        },
        {
            value: "SAT Beginner",
            label: "Khóa SAT Beginner",
            desc: "Đầu ra 1300-1400, tổng ôn kiến thức trọng tâm",
        },
        {
            value: "SAT Sprint",
            label: "Khóa SAT Sprint",
            desc: "Đầu ra 1450+ SAT, tập trung vào giải đề",
        },
        {
            value: "SAT 1-1",
            label: "Khóa SAT 1-1",
            desc: "Học riêng 1:1 với giáo viên",
        },
    ]
    const scheduleOptions = [
        "Tối Thứ 2, Thứ 6: 19h30 - 21h30",
        "Tối Thứ 2, Thứ 4: 19h30 - 21h30",
        "Tối Thứ 3, Thứ 6: 19h30 - 21h30",
        "Tối Thứ 3, Thứ 5: 19h30 - 21h30",
        "Sáng Thứ 7, Chủ Nhật: 10h00 - 12h00",
        "Chiều Thứ 7, Chủ Nhật: 17h30 - 19h30",
        "Tối Thứ 7, Chủ Nhật: 20h00 - 22h00",
    ]
    const discoveryOptions = [
        "Dự án, sự kiện, câu lạc bộ, tổ chức",
        "Thread QAS Academy",
        "Tiktok QAS Academy",
        "Facebook QAS Academy",
        "Instagram QAS Academy",
        "Phụ huynh giới thiệu",
        "Học viên giới thiệu",
        "Social media của Quốc An",
        "Comment của tư vấn viên Ngọc Anh",
    ]
    const contactMethodOptions = [
        { value: "facebook", label: "Facebook" },
        { value: "zalo/sdt", label: "Zalo / Điện thoại" },
    ]

    const toggleContactMethod = (method) => {
        const methods = formData.contactMethods
        if (methods.includes(method)) {
            updateFormData(
                "contactMethods",
                methods.filter((m) => m !== method)
            )
        } else {
            updateFormData("contactMethods", [...methods, method])
        }
    }
    const handleCountryChange = (country) => {
        updateFormData("country", country)
        updateFormData("state", "")
        if (country !== "Khác") updateFormData("customCountry", "")
    }
    const handleLearningPurposeChange = (p) => {
        updateFormData("learningPurpose", p)
        if (p !== "Other") updateFormData("customLearningPurpose", "")
    }
    const availableStates = useMemo(() => {
        if (formData.country && locationData[formData.country]) {
            return locationData[formData.country].states
        }
        return []
    }, [formData.country])

    // Simple submit function
    const submitForm = async () => {
        if (isSubmitting) return
        if (!validateStep(4)) return
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
        if (validateStep(currentStep) && currentStep < 4)
            setCurrentStep(currentStep + 1)
    }
    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const startNewForm = () => {
        setFormData({
            course: "",
            schedule: "",
            satScore: "",
            voucherCode: "",
            firstName: "",
            lastName: "",
            birthYear: "",
            email: "",
            phone: "",
            facebookLink: "",
            country: "",
            customCountry: "",
            state: "",
            school: "",
            discoverySource: "",
            contactMethods: [],
            learningPurpose: "",
            customLearningPurpose: "",
            testDate: "",
            targetScore: 1400,
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
                    <div style={{ fontSize: "64px", marginBottom: "24px" }}>
                        🎉
                    </div>
                    <h1
                        style={{
                            color: "#004aad",
                            fontSize: "32px",
                            marginBottom: "16px",
                            fontWeight: "700",
                        }}
                    >
                        Đăng ký thành công!
                    </h1>
                    <p
                        style={{
                            color: "#666",
                            fontSize: "18px",
                            lineHeight: "1.6",
                            marginBottom: "24px",
                        }}
                    >
                        Cảm ơn bạn đã đăng ký học thử tại QAS Academy. <br />
                        Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất!
                    </p>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <motion.button
                            onClick={() =>
                                window.open(
                                    "https://www.facebook.com/messages/t/108905614033440",
                                    "_blank"
                                )
                            }
                            style={{
                                background: "#004aad",
                                color: "white",
                                border: "none",
                                padding: "16px 24px",
                                borderRadius: "12px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                width: "100%",
                                transition: "all 0.3s ease",
                                boxShadow: "0 4px 12px rgba(24, 119, 242, 0.3)",
                            }}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: "0 6px 16px rgba(24, 119, 242, 0.4)",
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            📱 Nhắn xác nhận cho Fanpage QAS ngay!
                        </motion.button>
                        <motion.button
                            onClick={startNewForm}
                            style={{
                                background: "transparent",
                                color: "#004aad",
                                border: "2px solid #004aad",
                                padding: "16px 24px",
                                borderRadius: "12px",
                                fontSize: "16px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                width: "100%",
                                transition: "all 0.3s ease",
                            }}
                            whileHover={{ scale: 1.02, background: "#f0f7ff" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ➕ Đăng ký thêm khóa học khác
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
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
                    boxShadow: isMobile
                        ? "0 8px 24px rgba(0,74,173,0.08)"
                        : "0 20px 60px rgba(0,74,173,0.1)",
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
                        background:
                            "linear-gradient(135deg, #004aad 0%, #0066cc 100%)",
                        padding: isMobile
                            ? "24px 20px 20px 20px"
                            : isTablet
                              ? "32px 32px 24px 32px"
                              : "40px 40px 30px 40px",
                        color: "white",
                        textAlign: "center",
                    }}
                >
                    <h1
                        style={{
                            fontSize: fontSize.title,
                            margin: "0 0 8px 0",
                            fontWeight: "700",
                            lineHeight: "1.2",
                        }}
                    >
                        QAS Academy
                    </h1>
                    <p
                        style={{
                            margin: "0",
                            opacity: "0.9",
                            fontSize: fontSize.subtitle,
                            lineHeight: "1.4",
                        }}
                    >
                        Học và Thi Thử SAT Miễn Phí Cùng QAS Academy
                    </p>
                    <div
                        style={{
                            marginTop: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        {priorityData && (
                            <div
                                style={{
                                    padding: "6px 10px",
                                    background: "#ffffff20",
                                    border: "1px solid #ffffff40",
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 13,
                                }}
                            >
                                Ưu tiên: {priorityData.level} • Điểm:{" "}
                                {Math.round(priorityData.score)} •{" "}
                                {priorityData.label}
                            </div>
                        )}
                        <PoolBadge pool={engagementPool} />
                    </div>
                </div>

                {/* Progress & Steps */}
                <div
                    style={{
                        padding: isMobile
                            ? "24px 20px 16px 20px"
                            : isTablet
                              ? "32px 32px 20px 32px"
                              : "40px 40px 20px 40px",
                    }}
                >
                    <div
                        style={{
                            marginBottom: isMobile
                                ? "24px"
                                : isTablet
                                  ? "32px"
                                  : "40px",
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                position: "relative",
                                width: "100%",
                                marginBottom: isMobile ? "6px" : "8px",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: isMobile
                                        ? "20px"
                                        : isTablet
                                          ? "22.5px"
                                          : "25px",
                                    left: isMobile
                                        ? "20px"
                                        : isTablet
                                          ? "22.5px"
                                          : "25px",
                                    right: isMobile
                                        ? "20px"
                                        : isTablet
                                          ? "22.5px"
                                          : "25px",
                                    height: isMobile ? "3px" : "4px",
                                    background: "#e5e5e5",
                                    borderRadius: "2px",
                                    zIndex: 1,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: isMobile
                                        ? "20px"
                                        : isTablet
                                          ? "22.5px"
                                          : "25px",
                                    left: isMobile
                                        ? "20px"
                                        : isTablet
                                          ? "22.5px"
                                          : "25px",
                                    width: `${Math.min(((currentStep - 1) / 3) * 100, 100)}%`,
                                    maxWidth: `calc(100% - ${isMobile ? "40px" : isTablet ? "45px" : "50px"})`,
                                    height: isMobile ? "3px" : "4px",
                                    background: "#004aad",
                                    borderRadius: "2px",
                                    zIndex: 2,
                                    transition: "width 0.3s ease",
                                }}
                            />
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        position: "relative",
                                        zIndex: 3,
                                        flex: "1",
                                        minWidth: "0",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: isMobile
                                                ? "40px"
                                                : isTablet
                                                  ? "45px"
                                                  : "50px",
                                            height: isMobile
                                                ? "40px"
                                                : isTablet
                                                  ? "45px"
                                                  : "50px",
                                            borderRadius: "50%",
                                            background:
                                                step <= currentStep
                                                    ? "#004aad"
                                                    : "white",
                                            color:
                                                step <= currentStep
                                                    ? "white"
                                                    : "#999",
                                            border:
                                                step <= currentStep
                                                    ? "none"
                                                    : `${isMobile ? "2px" : "3px"} solid #e5e5e5`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "700",
                                            fontSize: isMobile
                                                ? "14px"
                                                : isTablet
                                                  ? "16px"
                                                  : "18px",
                                        }}
                                    >
                                        {step <= currentStep
                                            ? step < currentStep
                                                ? "✓"
                                                : step
                                            : step}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    style={{
                                        flex: "1",
                                        textAlign: "center",
                                        minWidth: "0",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: fontSize.small,
                                            color:
                                                step <= currentStep
                                                    ? "#004aad"
                                                    : "#999",
                                            fontWeight:
                                                step === currentStep
                                                    ? "600"
                                                    : "400",
                                        }}
                                    >
                                        Bước {step}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                minHeight: isMobile
                                    ? "280px"
                                    : isTablet
                                      ? "320px"
                                      : "360px",
                                padding: `0 ${spacing.formContent}`,
                            }}
                        >
                            {/* Step 1: Course & Schedule */}
                            {currentStep === 1 && (
                                <div>
                                    <h3
                                        style={{
                                            color: "#004aad",
                                            marginBottom: isMobile
                                                ? "20px"
                                                : isTablet
                                                  ? "24px"
                                                  : "30px",
                                            fontSize: fontSize.heading,
                                            fontWeight: "700",
                                        }}
                                    >
                                        Chọn Khóa Học & Lịch Học
                                    </h3>
                                    <div
                                        style={{
                                            marginBottom: isMobile
                                                ? "20px"
                                                : isTablet
                                                  ? "24px"
                                                  : "30px",
                                        }}
                                    >
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: isMobile
                                                    ? "8px"
                                                    : "12px",
                                                fontWeight: "600",
                                                color: "#333",
                                                fontSize: fontSize.body,
                                            }}
                                        >
                                            Khóa học bạn muốn tham gia *
                                        </label>
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: isMobile
                                                    ? "12px"
                                                    : isTablet
                                                      ? "14px"
                                                      : "16px",
                                                gridTemplateColumns: isMobile
                                                    ? "1fr"
                                                    : isTablet
                                                      ? "repeat(2, 1fr)"
                                                      : "1fr",
                                            }}
                                        >
                                            {courseOptions.map((option) => (
                                                <motion.div
                                                    key={option.value}
                                                    onClick={() =>
                                                        updateFormData(
                                                            "course",
                                                            option.value
                                                        )
                                                    }
                                                    style={{
                                                        padding: isMobile
                                                            ? "16px"
                                                            : isTablet
                                                              ? "18px"
                                                              : "20px",
                                                        border:
                                                            formData.course ===
                                                            option.value
                                                                ? "3px solid #004aad"
                                                                : "2px solid #e5e5e5",
                                                        borderRadius: isMobile
                                                            ? "8px"
                                                            : "12px",
                                                        cursor: "pointer",
                                                        background:
                                                            formData.course ===
                                                            option.value
                                                                ? "#f0f7ff"
                                                                : "white",
                                                    }}
                                                    whileHover={{
                                                        scale: isMobile
                                                            ? 1.01
                                                            : 1.02,
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: "700",
                                                            color: "#333",
                                                            marginBottom: "6px",
                                                            fontSize:
                                                                fontSize.body,
                                                        }}
                                                    >
                                                        {option.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: isMobile
                                                                ? "13px"
                                                                : "14px",
                                                            color: "#666",
                                                        }}
                                                    >
                                                        {option.desc}
                                                    </div>
                                                </motion.div>
                                            ))}
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
                                    <div style={{ marginBottom: "30px" }}>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "12px",
                                                fontWeight: "600",
                                                color: "#333",
                                                fontSize: "16px",
                                            }}
                                        >
                                            Khung giờ học *
                                        </label>
                                        <select
                                            value={formData.schedule}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "schedule",
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.schedule
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                                background: "white",
                                            }}
                                        >
                                            <option value="">
                                                Chọn khung giờ học
                                            </option>
                                            {scheduleOptions.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.schedule && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.schedule}
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
                                            Điểm SAT hiện tại (nếu có)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.satScore}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "satScore",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ví dụ: 1200"
                                            min="400"
                                            max="1600"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.satScore
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                            }}
                                        />
                                        {errors.satScore && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.satScore}
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
                                            Mã Voucher (nếu có)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.voucherCode}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "voucherCode",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập mã voucher"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Personal Info */}
                            {currentStep === 2 && (
                                <div>
                                    <h3
                                        style={{
                                            color: "#004aad",
                                            marginBottom: "30px",
                                            fontSize: "24px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        Thông Tin Cá Nhân
                                    </h3>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "20px",
                                            marginBottom: "25px",
                                        }}
                                    >
                                        <div>
                                            <label
                                                style={{
                                                    display: "block",
                                                    marginBottom: "12px",
                                                    fontWeight: "600",
                                                    color: "#333",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                Họ *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "firstName",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập họ"
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.firstName
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                }}
                                            />
                                            {errors.firstName && (
                                                <div
                                                    style={{
                                                        color: "#dc2626",
                                                        fontSize: "14px",
                                                        marginTop: "8px",
                                                    }}
                                                >
                                                    {errors.firstName}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label
                                                style={{
                                                    display: "block",
                                                    marginBottom: "12px",
                                                    fontWeight: "600",
                                                    color: "#333",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                Tên *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "lastName",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập tên"
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.lastName
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                }}
                                            />
                                            {errors.lastName && (
                                                <div
                                                    style={{
                                                        color: "#dc2626",
                                                        fontSize: "14px",
                                                        marginTop: "8px",
                                                    }}
                                                >
                                                    {errors.lastName}
                                                </div>
                                            )}
                                        </div>
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
                                            onChange={(e) =>
                                                updateFormData(
                                                    "birthYear",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ví dụ: 2005"
                                            min="1990"
                                            max="2015"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.birthYear
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
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
                                            onChange={(e) =>
                                                updateFormData(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="example@gmail.com"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.email
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
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
                                            onChange={(e) =>
                                                updateFormData(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0123456789 hoặc +84123456789"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.phone
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
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
                                            Link Facebook
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.facebookLink}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "facebookLink",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="https://facebook.com/username"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.facebookLink
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
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
                                </div>
                            )}

                            {/* Step 3: Location & Discovery */}
                            {currentStep === 3 && (
                                <div>
                                    <h3
                                        style={{
                                            color: "#004aad",
                                            marginBottom: "30px",
                                            fontSize: "24px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        Thông Tin Học Tập
                                    </h3>
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
                                            Quốc gia bạn đang học tập *
                                        </label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) =>
                                                handleCountryChange(
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.country
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                                background: "white",
                                            }}
                                        >
                                            <option value="">
                                                Chọn quốc gia
                                            </option>
                                            {countries.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.country && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.country}
                                            </div>
                                        )}
                                    </div>
                                    {formData.country === "Khác" && (
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
                                                Tên quốc gia *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.customCountry}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "customCountry",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập tên quốc gia"
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.customCountry
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                }}
                                            />
                                            {errors.customCountry && (
                                                <div
                                                    style={{
                                                        color: "#dc2626",
                                                        fontSize: "14px",
                                                        marginTop: "8px",
                                                    }}
                                                >
                                                    {errors.customCountry}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                            Tỉnh thành / bang *
                                        </label>
                                        {availableStates.length > 0 ? (
                                            <select
                                                value={formData.state}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "state",
                                                        e.target.value
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.state
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                    background: "white",
                                                }}
                                            >
                                                <option value="">
                                                    Chọn tỉnh thành / bang
                                                </option>
                                                {availableStates.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "state",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập tỉnh thành / bang"
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.state
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                }}
                                            />
                                        )}
                                        {errors.state && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.state}
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
                                            Trường bạn đang theo học *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.school}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "school",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ví dụ: THPT Chuyên Lê Quý Đôn"
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.school
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                            }}
                                        />
                                        {errors.school && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.school}
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
                                            Bạn biết đến QAS Academy qua đâu *
                                        </label>
                                        <select
                                            value={formData.discoverySource}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "discoverySource",
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.discoverySource
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                                background: "white",
                                            }}
                                        >
                                            <option value="">
                                                Chọn nguồn thông tin
                                            </option>
                                            {discoveryOptions.map((o) => (
                                                <option key={o} value={o}>
                                                    {o}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.discoverySource && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.discoverySource}
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
                                            Chúng tôi có thể liên hệ bạn qua
                                            hình thức nào * (có thể chọn nhiều)
                                        </label>
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "16px",
                                            }}
                                        >
                                            {contactMethodOptions.map((m) => (
                                                <motion.div
                                                    key={m.value}
                                                    onClick={() =>
                                                        toggleContactMethod(
                                                            m.value
                                                        )
                                                    }
                                                    style={{
                                                        padding: "16px",
                                                        border: formData.contactMethods.includes(
                                                            m.value
                                                        )
                                                            ? "2px solid #004aad"
                                                            : "2px solid #e5e5e5",
                                                        borderRadius: "12px",
                                                        cursor: "pointer",
                                                        textAlign: "center",
                                                        background:
                                                            formData.contactMethods.includes(
                                                                m.value
                                                            )
                                                                ? "#f0f7ff"
                                                                : "white",
                                                        fontWeight: "600",
                                                    }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {m.label}
                                                    {formData.contactMethods.includes(
                                                        m.value
                                                    ) && (
                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    "8px",
                                                                color: "#004aad",
                                                            }}
                                                        >
                                                            ✓
                                                        </span>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                        {errors.contactMethods && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.contactMethods}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Goals */}
                            {currentStep === 4 && (
                                <div>
                                    <h3
                                        style={{
                                            color: "#004aad",
                                            marginBottom: "30px",
                                            fontSize: "24px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        Mục Tiêu Học Tập
                                    </h3>
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
                                            Mục đích học SAT *
                                        </label>
                                        <select
                                            value={formData.learningPurpose}
                                            onChange={(e) =>
                                                handleLearningPurposeChange(
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.learningPurpose
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                                background: "white",
                                            }}
                                        >
                                            <option value="">
                                                Chọn mục đích học
                                            </option>
                                            <option value="Xét tuyển Đại học trong nước">
                                                Xét tuyển Đại học trong nước
                                            </option>
                                            <option value="Xét tuyển Đại học Mĩ">
                                                Xét tuyển Đại học Mĩ
                                            </option>
                                            <option value="Xét tuyển Đại học Úc">
                                                Xét tuyển Đại học Úc
                                            </option>
                                            <option value="Xét tuyển Đại học Canada">
                                                Xét tuyển Đại học Canada
                                            </option>
                                            <option value="Xét tuyển Đại học Anh">
                                                Xét tuyển Đại học Anh
                                            </option>
                                            <option value="Other">Khác</option>
                                        </select>
                                        {errors.learningPurpose && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.learningPurpose}
                                            </div>
                                        )}
                                    </div>
                                    {formData.learningPurpose === "Other" && (
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
                                                Mục đích học khác *
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    formData.customLearningPurpose
                                                }
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "customLearningPurpose",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập mục đích học của bạn"
                                                style={{
                                                    width: "100%",
                                                    padding: "16px",
                                                    border: errors.customLearningPurpose
                                                        ? "2px solid #dc2626"
                                                        : "2px solid #e5e5e5",
                                                    borderRadius: "12px",
                                                    fontSize: "16px",
                                                }}
                                            />
                                            {errors.customLearningPurpose && (
                                                <div
                                                    style={{
                                                        color: "#dc2626",
                                                        fontSize: "14px",
                                                        marginTop: "8px",
                                                    }}
                                                >
                                                    {
                                                        errors.customLearningPurpose
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                            Thời gian dự kiến thi SAT *
                                        </label>
                                        <select
                                            value={formData.testDate}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "testDate",
                                                    e.target.value
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "16px",
                                                border: errors.testDate
                                                    ? "2px solid #dc2626"
                                                    : "2px solid #e5e5e5",
                                                borderRadius: "12px",
                                                fontSize: "16px",
                                                background: "white",
                                            }}
                                        >
                                            <option value="">
                                                Chọn thời gian thi
                                            </option>
                                            <option value="Tháng 06/2025">
                                                Tháng 06/2025
                                            </option>
                                            <option value="Tháng 08/2025">
                                                Tháng 08/2025
                                            </option>
                                            <option value="Tháng 09/2025">
                                                Tháng 09/2025
                                            </option>
                                            <option value="Tháng 11/2025">
                                                Tháng 11/2025
                                            </option>
                                            <option value="Tháng 12/2025">
                                                Tháng 12/2025
                                            </option>
                                            <option value="2026+">2026+</option>
                                            <option value="Chưa xác định">
                                                Chưa xác định
                                            </option>
                                        </select>
                                        {errors.testDate && (
                                            <div
                                                style={{
                                                    color: "#dc2626",
                                                    fontSize: "14px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {errors.testDate}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginBottom: "20px" }}>
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "16px",
                                                fontWeight: "600",
                                                color: "#333",
                                                fontSize: "16px",
                                            }}
                                        >
                                            Mức điểm SAT mong muốn:{" "}
                                            {formData.targetScore}
                                        </label>
                                        <input
                                            type="range"
                                            min="1300"
                                            max="1600"
                                            step="50"
                                            value={formData.targetScore}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "targetScore",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                height: "8px",
                                                borderRadius: "4px",
                                                background: `linear-gradient(to right, #004aad 0%, #004aad ${((formData.targetScore - 1300) / (1600 - 1300)) * 100}%, #e5e5e5 ${((formData.targetScore - 1300) / (1600 - 1300)) * 100}%, #e5e5e5 100%)`,
                                            }}
                                        />
                                    </div>
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
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <motion.div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: isMobile
                                ? "24px"
                                : isTablet
                                  ? "32px"
                                  : "40px",
                            paddingTop: isMobile
                                ? "20px"
                                : isTablet
                                  ? "24px"
                                  : "30px",
                            paddingLeft: spacing.formContent,
                            paddingRight: spacing.formContent,
                            borderTop: "2px solid #f0f0f0",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? "16px" : "0",
                        }}
                    >
                        <motion.button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            style={{
                                padding: isMobile
                                    ? "14px 24px"
                                    : isTablet
                                      ? "15px 28px"
                                      : "16px 32px",
                                border: "2px solid #e5e5e5",
                                borderRadius: isMobile ? "8px" : "12px",
                                background: "white",
                                color: "#666",
                                fontWeight: 600,
                                cursor:
                                    currentStep === 1
                                        ? "not-allowed"
                                        : "pointer",
                                opacity: currentStep === 1 ? 0.5 : 1,
                                width: isMobile ? "100%" : "auto",
                                order: isMobile ? 2 : 1,
                            }}
                        >
                            ← Quay lại
                        </motion.button>
                        {currentStep < 4 ? (
                            <motion.button
                                onClick={nextStep}
                                style={{
                                    padding: isMobile
                                        ? "14px 24px"
                                        : isTablet
                                          ? "15px 28px"
                                          : "16px 32px",
                                    border: "none",
                                    borderRadius: isMobile ? "8px" : "12px",
                                    background:
                                        "linear-gradient(135deg, #004aad 0%, #0066cc 100%)",
                                    color: "white",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    width: isMobile ? "100%" : "auto",
                                    order: isMobile ? 1 : 2,
                                }}
                            >
                                Tiếp theo →
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={submitForm}
                                disabled={isSubmitting || !!rateLimitError}
                                style={{
                                    padding: isMobile
                                        ? "14px 24px"
                                        : isTablet
                                          ? "15px 32px"
                                          : "16px 40px",
                                    border: "none",
                                    borderRadius: isMobile ? "8px" : "12px",
                                    background:
                                        isSubmitting || rateLimitError
                                            ? "#ccc"
                                            : "linear-gradient(135deg, #004aad 0%, #0066cc 100%)",
                                    color: "white",
                                    fontWeight: 700,
                                    cursor:
                                        isSubmitting || rateLimitError
                                            ? "not-allowed"
                                            : "pointer",
                                    width: isMobile ? "100%" : "auto",
                                    order: isMobile ? 1 : 2,
                                }}
                            >
                                {isSubmitting
                                    ? "Đang gửi..."
                                    : rateLimitError
                                      ? "Tạm thời không thể gửi"
                                      : "Hoàn thành đăng ký 🚀"}
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
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
