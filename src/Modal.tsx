import { ReactNode, useEffect, useLayoutEffect, useRef } from "react";

// Stack of mounted modal ids in mount order; the last entry is the topmost
// dialog. Used so a single browser back press only fires the topmost modal's
// onClose (instead of every nested modal's listener firing in parallel).
const modalStack: number[] = [];
let nextModalId = 0;

export const Modal = ({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
}) => {
	// Stash onClose in a ref so the effect can have empty deps. Parents pass
	// a fresh closure on every render; without this the effect would tear
	// down and re-build on every re-render, flapping history.back/pushState.
	const onCloseRef = useRef(onClose);
	useLayoutEffect(() => {
		onCloseRef.current = onClose;
	});
	useEffect(() => {
		const id = nextModalId++;
		modalStack.push(id);
		history.pushState(null, "");
		const onPopState = () => {
			if (modalStack[modalStack.length - 1] !== id) return;
			onCloseRef.current();
		};
		// Capture-phase Escape so NetHack's window listeners don't
		// intercept the close key while the modal is open.
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && modalStack[modalStack.length - 1] === id) {
				e.stopPropagation();
				onCloseRef.current();
			}
		};
		window.addEventListener("popstate", onPopState);
		window.addEventListener("keydown", onKeyDown, { capture: true });
		return () => {
			window.removeEventListener("popstate", onPopState);
			window.removeEventListener("keydown", onKeyDown, { capture: true });
			const idx = modalStack.indexOf(id);
			if (idx !== -1) modalStack.splice(idx, 1);
		};
	}, []);

	return (
		<div className="modal-backdrop" onClick={onClose}>
		<div
			className="modal"
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			role="dialog"
			aria-label={title}
		>
				<div className="modal-header">
					<h2>{title}</h2>
					<button
						className="modal-close"
						onClick={onClose}
						aria-label="Close"
					>
						×
					</button>
				</div>
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
};
