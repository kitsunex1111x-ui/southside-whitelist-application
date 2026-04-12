// Enhanced Apply.tsx with debug logging
// Replace the handleSubmit function in Apply.tsx with this version

const handleSubmit = async () => {
  console.log("=== Submit Application Debug Started ===");
  
  if (!user) {
    console.error("No user logged in");
    toast.error("Please sign in to submit application");
    return;
  }
  
  console.log("User logged in:", user.id, user.email);
  
  if (!validateForm()) {
    console.error("Form validation failed");
    return;
  }
  
  console.log("Form validation passed");
  console.log("Form data:", data);
  
  setSubmitting(true);

  try {
    console.log("Attempting to insert into applications table...");
    
    const insertData = {
      user_id: user.id,
      real_name: data.realName,
      discord: data.discord,
      age: data.age,
      rdm: data.rdm,
      vdm: data.vdm,
      metagaming: data.metagaming,
      powergaming: data.powergaming,
      char_name: data.charName,
      backstory: data.backstory,
      traits: data.traits,
    };
    
    console.log("Insert data:", insertData);
    
    const { data: result, error } = await supabase.from("applications").insert(insertData).select();
    
    console.log("Insert result:", result);
    console.log("Insert error:", error);
    
    if (error) {
      console.error("Database error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error("Failed to submit: " + error.message);
    } else {
      console.log("Application submitted successfully!");
      setSubmitted(true);
      toast.success("Application submitted!");
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    toast.error("Unexpected error: " + e.message);
  } finally {
    setSubmitting(false);
  }
};
