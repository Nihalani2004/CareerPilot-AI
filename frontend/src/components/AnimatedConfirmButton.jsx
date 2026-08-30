import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./animatedConfirmButton.scss";

const springTransition = { type: "spring", bounce: 0, duration: .4 };

export default function AnimatedConfirmButton({
    triggerLabel,
    triggerIcon,
    triggerClassName = "",
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    confirmClassName = "",
    disabled = false,
    onConfirm,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const confirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm?.();
            setIsOpen(false);
        } finally {
            setIsConfirming(false);
        }
    };

    return <>
        <AnimatePresence>
            {!isOpen && <motion.button key="trigger" type="button" className={`animated-confirm__trigger ${triggerClassName}`} aria-label={triggerLabel} title={triggerLabel} disabled={disabled} onClick={(event) => { event.stopPropagation(); setIsOpen(true); }} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }} whileTap={{ scale: .95 }} transition={springTransition}>{triggerIcon || triggerLabel}</motion.button>}
        </AnimatePresence>
        {createPortal(<AnimatePresence>
            {isOpen && <motion.div className="animated-confirm__overlay" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.section className={`animated-confirm__dialog ${confirmClassName}`} initial={{ y: 72, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 72, opacity: 0, scale: .98 }} transition={springTransition}>
                    <button className="animated-confirm__close" type="button" aria-label="Close confirmation" onClick={() => setIsOpen(false)} disabled={isConfirming}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
                    <div className="animated-confirm__icon">{triggerIcon || <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4" /></svg>}</div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                    <div className="animated-confirm__actions"><button type="button" onClick={() => setIsOpen(false)} disabled={isConfirming}>{cancelLabel}</button><motion.button type="button" className="animated-confirm__approve" onClick={confirm} disabled={isConfirming} whileTap={{ scale: .97 }} transition={springTransition}>{isConfirming ? "Please wait..." : confirmLabel}</motion.button></div>
                </motion.section>
            </motion.div>}
        </AnimatePresence>, document.body)}
    </>;
}
