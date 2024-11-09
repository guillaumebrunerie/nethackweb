import { copyrightMessage } from "../lib/nethackInterface";

export const CopyrightWindow = () => {
	return (
		<div className="copyright">
			{copyrightMessage().map((msg, i) => (
				<div key={i} className="line">
					{msg}
				</div>
			))}
		</div>
	);
};
