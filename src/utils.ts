import { CSSProperties } from "react";
import { StylesType, initRendererProps } from "./types";
import { Renderer } from "marked";
import { styles } from "./styles";

function escapeQuotes(value: unknown) {
  if (typeof value === 'string' && value.includes('"')) {
    return value.replace(/"/g, "&#x27;");
  }
  return value;
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/[&"'<>]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return char;
    }
  });
}

export function camelToKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function parseCssInJsToInlineCss(
  cssProperties: CSSProperties | undefined
): string {
  if (!cssProperties) return "";

  const numericalCssProperties = [
    "width",
    "height",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderWidth",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "outlineWidth",
    "top",
    "right",
    "bottom",
    "left",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "maxWidth",
    "minWidth",
    "maxHeight",
    "minHeight",
    "borderRadius",
    "borderTopLeftRadius",
    "borderTopRightRadius",
    "borderBottomLeftRadius",
    "borderBottomRightRadius",
    "textIndent",
    "gridColumnGap",
    "gridRowGap",
    "gridGap",
    "translateX",
    "translateY",
  ];

  return Object.entries(cssProperties)
    .map(([property, value]) => {
      if (
        typeof value === "number" &&
        numericalCssProperties.includes(property)
      ) {
        return `${camelToKebabCase(property)}:${value}px`;
      } else {
        const escapedValue = escapeQuotes(value);
        return `${camelToKebabCase(property)}:${escapedValue}`;
      }
    })
    .join(";");
}

export const initRenderer = ({
  customStyles,
}: initRendererProps): Renderer => {
  const finalStyles = { ...styles, ...customStyles };

  const customRenderer = new Renderer();

  customRenderer.blockquote = ({ tokens }) => {
    const quote = customRenderer.parser.parse(tokens);

    return `<blockquote${
      parseCssInJsToInlineCss(finalStyles.blockQuote) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.blockQuote)}"`
        : ""
    }>\n${quote}</blockquote>\n`;
  }

  customRenderer.br = () => {
    return `<br${
      parseCssInJsToInlineCss(finalStyles.br) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.br)}"`
        : ""
    } />`;
  }

  customRenderer.code = ({ text }) => {
    const code = text.replace(/\n$/, "") + "\n";

    return `<pre${
      parseCssInJsToInlineCss(finalStyles.codeBlock) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.codeBlock)}"`
        : ""
    }><code>${code}</code></pre>\n`;
  }

  customRenderer.codespan = ({ text }) => {
    return `<code${
      parseCssInJsToInlineCss(finalStyles.codeInline) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.codeInline)}"`
        : ""
    }>${text}</code>`;
  }

  customRenderer.del = ({ tokens }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<del${
      parseCssInJsToInlineCss(finalStyles.strikethrough) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.strikethrough)}"`
        : ""
    }>${text}</del>`;
  }

  customRenderer.em = ({ tokens }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<em${
      parseCssInJsToInlineCss(finalStyles.italic) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.italic)}"`
        : ""
    }>${text}</em>`;
  }

  customRenderer.heading = ({ tokens, depth }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<h${depth}${
      parseCssInJsToInlineCss(
        finalStyles[`h${depth}` as keyof StylesType]
      ) !== ""
        ? ` style="${parseCssInJsToInlineCss(
            finalStyles[`h${depth}` as keyof StylesType]
          )}"`
        : ""
    }>${text}</h${depth}>`;
  }

  customRenderer.hr = () => {
    return `<hr${
      parseCssInJsToInlineCss(finalStyles.hr) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.hr)}"`
        : ""
    } />\n`;
  }

  customRenderer.image = ({ href, text, tokens }) => {
    let altText = text ?? "";
    if (tokens) {
      altText = customRenderer.parser.parseInline(
        tokens,
        customRenderer.parser.textRenderer
      );
    }

    const srcAttr = escapeHtmlAttr(href ?? "");
    const altAttr = escapeHtmlAttr(altText);
    const imageStyle = parseCssInJsToInlineCss(finalStyles.image);

    return `<img src="${srcAttr}" alt="${altAttr}"${
      imageStyle !== "" ? ` style="${imageStyle}"` : ""
    }>`;
  }

  customRenderer.link = ({ href, tokens }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<a href="${href}" target="_blank"${
        parseCssInJsToInlineCss(finalStyles.link) !== ""
          ? ` style="${parseCssInJsToInlineCss(finalStyles.link)}"`
          : ""
      }>${text}</a>`;
  }

  customRenderer.list = (token) => {
    const body = token.items.map((item) => customRenderer.listitem(item)).join("");
    const type = token.ordered ? "ol" : "ul";
      const startatt = token.ordered && token.start !== 1 && token.start !== ""
        ? ' start="' + token.start + '"'
        : "";
      const styles = parseCssInJsToInlineCss(
        finalStyles[token.ordered ? "ol" : "ul"]
      );
      return (
        "<" +
        type +
        startatt +
        `${styles !== "" ? ` style="${styles}"` : ""}>\n` +
        body +
        "</" +
        type +
        ">\n"
      );
  }

  customRenderer.listitem = (item) => {
    const text = customRenderer.parser.parse(item.tokens);

    return `<li${
      parseCssInJsToInlineCss(finalStyles.li) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.li)}"`
        : ""
    }>${text}</li>\n`;
  }

  customRenderer.paragraph = ({ tokens }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<p${
      parseCssInJsToInlineCss(finalStyles.p) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.p)}"`
        : ""
    }>${text}</p>\n`;
  }

  customRenderer.strong = ({ tokens }) => {
    const text = customRenderer.parser.parseInline(tokens);

    return `<strong${
      parseCssInJsToInlineCss(finalStyles.bold) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.bold)}"`
        : ""
    }>${text}</strong>`;
  }

  customRenderer.table = (token) => {
    let header = "";
    let body = "";

    token.header.forEach((cell) => {
      header += customRenderer.tablecell(cell);
    });

    token.rows.forEach((row) => {
      let rowContent = "";

      row.forEach((cell) => {
        rowContent += customRenderer.tablecell(cell);
      });

      body += customRenderer.tablerow({ text: rowContent });
    });

    header = customRenderer.tablerow({ text: header });

    if (body) body = `<tbody>${body}</tbody>`;

      return `<table${
        parseCssInJsToInlineCss(finalStyles.table) !== ""
          ? ` style="${parseCssInJsToInlineCss(finalStyles.table)}"`
          : ""
      }>\n<thead${
        parseCssInJsToInlineCss(finalStyles.thead) !== ""
          ? ` style="${parseCssInJsToInlineCss(finalStyles.thead)}"`
          : ""
      }>\n${header}</thead>\n${body}</table>\n`;
  }

  customRenderer.tablecell = (token) => {
    const content = customRenderer.parser.parseInline(token.tokens);
    const type = token.header ? "th" : "td";
    const styles = parseCssInJsToInlineCss(
      finalStyles[token.header ? "th" : "td"]
    );
    const tag = token.align
      ? `<${type} align="${token.align}"${
          styles !== "" ? ` style="${styles}"` : ""
        }>`
      : `<${type}${styles !== "" ? ` style="${styles}"` : ""}>`;
    return tag + content + `</${type}>\n`;
  }

  customRenderer.tablerow = ({ text }) => {
    return `<tr${
      parseCssInJsToInlineCss(finalStyles.tr) !== ""
        ? ` style="${parseCssInJsToInlineCss(finalStyles.tr)}"`
        : ""
    }>\n${text}</tr>\n`;
  }

  return customRenderer;
};
