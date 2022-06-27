const fs = require("fs");
const path = require("path");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");


const AltPattern = /(\balt\b)/i;
const KeystrokePattern = /keystroke/;
const TrailingSlashPattern = /(\S)\/>/g;
const SpaceTrailingSlash = "$1 />";
const Cmd = "meta";
const KeyboardShortcut = "keyboard-shortcut";
const MouseShortcut = "mouse-shortcut";


const parseOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: ""
};
const buildOptions = {
	...parseOptions,
	format: true,
	suppressEmptyNode: true
};
const parser = new XMLParser(parseOptions);
const builder = new XMLBuilder(buildOptions);

const filePath = path.resolve(__dirname, "../test.xml");
const outputPath = path.resolve(__dirname, "../out.xml");
const xml = fs.readFileSync(filePath, "utf8");
const data = parser.parse(xml);


function convertKeystroke(
	keystroke)
{
	const keys = Object.keys(keystroke);
	const values = Object.values(keystroke);

	keys.forEach((key, i) => {
		if (KeystrokePattern.test(key)) {
			values[i] = values[i].replace(AltPattern, Cmd);
		}
	});

	return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}


data.keymap.action.forEach(action => {
	const shortcutKey = KeyboardShortcut in action
		? KeyboardShortcut
		: MouseShortcut;
	const shortcuts = action[shortcutKey];

	if (shortcuts) {
		if (shortcuts instanceof Array) {
			action[shortcutKey] = shortcuts.map(convertKeystroke);
		} else {
			action[shortcutKey] = convertKeystroke(shortcuts);
		}
	}
});

const output = builder.build(data).replace(TrailingSlashPattern, SpaceTrailingSlash);

fs.writeFileSync(outputPath, output);
