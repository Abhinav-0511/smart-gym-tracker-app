import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqListProps {
  faq: { q: string; a: string }[];
}

/** Renders a page's verified FAQ as an accordion. Purely presentational. */
const FaqList = ({ faq }: FaqListProps) => {
  if (faq.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No frequently asked questions for this page yet.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faq.map((item, index) => (
        <AccordionItem key={item.q} value={`faq-${index}`}>
          <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FaqList;
