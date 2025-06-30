import React from 'react'

export default function Glass({ children, styles = '' }) {

    return (
        <div className={`backdrop-blur-sm ${styles}`}>{children}</div>
    )
}
