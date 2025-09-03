import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

function TestForm() {
  const form = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: "",
    },
  });

  return <div>Test form setup is working</div>;
}

export default TestForm;