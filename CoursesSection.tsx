import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

const BASE_URL = "https://syncsphere-hiv6.onrender.com"

interface Course {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type Status = "loading" | "error" | "empty" | "success"

/**
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CoursesSection(props) {
    // Extra toggles and changeable feature from framer toolbar
    const { accentColor, showRefundableBadge } = props

    const [courses, setCourses] = useState<Course[] | null>(null)
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const [courseError, setCourseError] = useState(false)
    const [countryError, setCountryError] = useState(false)
    const [loading, setLoading] = useState(true)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const [columns, setColumns] = useState(3)

    useEffect(() => {
        // To get the actual width of this component reliably
        // because it was bugging inside a narrower FFramer container
        const el = wrapperRef.current
        if (!el) return

        // Watch for changes to the component's width so the cards adapts when the frame is resized.
        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width
            if (width < 480) setColumns(1)
            else if (width < 810) setColumns(2)
            else setColumns(3)
        })
        observer.observe(el)
        //cleanup
        return () => observer.disconnect()
    }, [])

    const load = useCallback(async () => {
        setLoading(true)
        setCourseError(false)
        setCountryError(false)

        const [courseRes, countryRes] = await Promise.allSettled([
            fetch(`${BASE_URL}/assignment/course-data`, { method: "GET" }).then(
                (r) => {
                    if (!r.ok) throw new Error(`course-data ${r.status}`)
                    return r.json()
                }
            ),
            fetch(`${BASE_URL}/assignment/country-code`, {
                method: "GET",
            }).then((r) => {
                if (!r.ok) throw new Error(`country-code ${r.status}`)
                return r.json()
            }),
        ])

        if (
            courseRes.status === "fulfilled" &&
            Array.isArray(courseRes.value)
        ) {
            setCourses(courseRes.value)
        } else {
            setCourseError(true)
            setCourses(null)
        }

        if (
            countryRes.status === "fulfilled" &&
            countryRes.value?.country_code
        ) {
            setCountryCode(countryRes.value.country_code)
        } else {
            setCountryError(true)
            setCountryCode(null)
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const status: Status = loading
        ? "loading"
        : courseError
          ? "error"
          : courses && courses.length === 0
            ? "empty"
            : "success"

    const formatPrice = (course: Course) => {
        // By default the pricing will be in USD if the
        // '/country-code' api fails
        const region = countryCode || "US"
        if (region === "IN") {
            return (course.pricePaise / 100).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            })
        }
        return (course.priceUsdCents / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
        })
    }

    const gridStyle: React.CSSProperties = {
        ...styles.grid,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }

    return (
        <div ref={wrapperRef} style={styles.wrapper}>
            {status === "success" && countryError && (
                <div style={styles.warning}>
                    Pricing region unavailable — showing estimated USD pricing.
                </div>
            )}

            {status === "loading" && (
                <div style={gridStyle}>
                    {Array.from({ length: columns * 2 }).map((_, i) => (
                        <div key={i} style={styles.skeletonCard}>
                            <div
                                style={{
                                    ...styles.skelLine,
                                    width: "40%",
                                    height: 10,
                                }}
                            />
                            <div
                                style={{
                                    ...styles.skelLine,
                                    width: "80%",
                                    height: 16,
                                    marginTop: 14,
                                }}
                            />
                            <div
                                style={{
                                    ...styles.skelLine,
                                    width: "100%",
                                    height: 12,
                                    marginTop: 12,
                                }}
                            />
                            <div
                                style={{
                                    ...styles.skelLine,
                                    width: "60%",
                                    height: 12,
                                    marginTop: 6,
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {status === "error" && (
                <div style={styles.messageBox}>
                    <p style={styles.messageTitle}>
                        We couldn't load the courses
                    </p>
                    <p style={styles.messageBody}>
                        Something went wrong while loading the course catalog.
                        Please try again in a moment.
                    </p>
                    <button
                        style={{ ...styles.retryBtn, background: accentColor }}
                        onClick={load}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === "empty" && (
                <div style={styles.messageBox}>
                    <p style={styles.messageTitle}>
                        No courses available right now
                    </p>
                    <p style={styles.messageBody}>Check back shortly.</p>
                    <button
                        style={{ ...styles.retryBtn, background: accentColor }}
                        onClick={load}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === "success" && (
                <div style={gridStyle}>
                    {courses!.map((course) => (
                        <div key={course.mangoId} style={styles.card}>
                            <div style={styles.category}>
                                {course.mainCategory}
                            </div>
                            <h3 style={styles.title}>{course.courseName}</h3>
                            <p style={styles.desc}>{course.description}</p>
                            <div style={styles.footRow}>
                                <span
                                    style={{
                                        ...styles.price,
                                        color: accentColor,
                                    }}
                                >
                                    {formatPrice(course)}
                                </span>
                                {showRefundableBadge && course.refundable && (
                                    <span
                                        style={{
                                            ...styles.badge,
                                            background: accentColor,
                                        }}
                                    >
                                        <p style={styles.badgeText}>
                                            Refundable
                                        </p>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CoursesSection, {
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#E0A238",
    },
    showRefundableBadge: {
        type: ControlType.Boolean,
        title: "Show Refundable Badge",
        defaultValue: true,
    },
})

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        width: "100%",
        fontFamily: "inherit",
    },
    warning: {
        fontSize: 12,
        marginBottom: 16,
        color: "#B97E1F",
    },
    grid: {
        display: "grid",
        gap: 20,
        width: "100%",
    },
    card: {
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: 6,
        padding: 20,
    },
    skeletonCard: {
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 6,
        padding: 20,
    },
    skelLine: {
        background: "rgba(0,0,0,0.08)",
        borderRadius: 3,
    },
    category: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#3E7C5C",
        marginBottom: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: 600,
        margin: "0 0 8px 0",
        lineHeight: 1.3,
    },
    desc: {
        fontSize: 13.5,
        lineHeight: 1.5,
        color: "rgba(0,0,0,0.6)",
        margin: "0 0 16px 0",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
    },
    footRow: {
        marginTop: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 14,
        borderTop: "1px dashed rgba(0,0,0,0.1)",
    },
    price: {
        fontSize: 16,
        fontWeight: 700,
    },
    badge: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#fff",
        padding: "3px 8px",
        borderRadius: 20,
    },
    badgeText: {
        margin: 0,
        marginTop: 2,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#fff",
    },
    messageBox: {
        border: "1px dashed rgba(0,0,0,0.2)",
        borderRadius: 6,
        padding: "50px 20px",
        textAlign: "center",
    },
    messageTitle: {
        fontSize: 16,
        fontWeight: 600,
        margin: "0 0 8px 0",
    },
    messageBody: {
        fontSize: 13,
        color: "rgba(0,0,0,0.6)",
        margin: "0 0 16px 0",
    },
    retryBtn: {
        border: "none",
        color: "black",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        padding: "10px 18px",
        borderRadius: 4,
        cursor: "pointer",
    },
}
