// // Animation keyframes as CSS strings
// export const slideDownAnimation = `
// @keyframes slideDown {
//     from {
//         opacity: 0;
//         transform: translateY(-10px);
//     }
//     to {
//         opacity: 1;
//         transform: translateY(0);
//     }
// }
// `;

// export const fadeInAnimation = `
// @keyframes fadeIn {
//     from {
//         opacity: 0;
//     }
//     to {
//         opacity: 1;
//     }
// }
// `;

// export const rotateAnimation = `
// @keyframes rotate {
//     from {
//         transform: rotate(0deg);
//     }
//     to {
//         transform: rotate(360deg);
//     }
// }
// `;

// export const pulseAnimation = `
// @keyframes pulse {
//     0% {
//         transform: scale(1);
//     }
//     50% {
//         transform: scale(1.05);
//     }
//     100% {
//         transform: scale(1);
//     }
// }
// `;

// export const shimmerAnimation = `
// @keyframes shimmer {
//     0% {
//         background-position: -200% 0;
//     }
//     100% {
//         background-position: 200% 0;
//     }
// }
// `;

// // Animation utility functions
// export const getAnimationStyles = () => `
//     ${slideDownAnimation}
//     ${fadeInAnimation}
//     ${rotateAnimation}
//     ${pulseAnimation}
//     ${shimmerAnimation}

//     .navbar-collapse.show {
//         animation: slideDown 0.3s ease-out forwards;
//     }

//     .dropdown-menu.show {
//         animation: fadeIn 0.2s ease-out forwards;
//     }

//     .dropdown-toggle::after {
//         display: none !important;
//     }
// `; 

// Animation keyframes as CSS strings
export const slideDownAnimation = `
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

export const fadeInAnimation = `
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
`;

export const rotateAnimation = `
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
`;

export const pulseAnimation = `
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}
`;

export const shimmerAnimation = `
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}
`;

// Animation utility functions
export const getAnimationStyles = () => `
    ${slideDownAnimation}
    ${fadeInAnimation}
    ${rotateAnimation}
    ${pulseAnimation}
    ${shimmerAnimation}

    .navbar-collapse.show {
        animation: slideDown 0.3s ease-out forwards;
    }

    .dropdown-menu.show {
        animation: fadeIn 0.2s ease-out forwards;
    }

    .dropdown-toggle::after {
        display: none !important;
    }
`; 