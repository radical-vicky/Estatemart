import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session after OAuth redirect
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setStatus("error");
          setErrorMessage(error.message);
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive",
          });
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }
        
        if (session) {
          console.log("User authenticated:", session.user.email);
          setStatus("success");
          toast({
            title: "Welcome!",
            description: `Signed in as ${session.user.email}`,
          });
          setTimeout(() => navigate("/"), 2000);
        } else {
          setStatus("error");
          setErrorMessage("No session found");
          setTimeout(() => navigate("/auth"), 3000);
        }
      } catch (err: any) {
        console.error("Callback error:", err);
        setStatus("error");
        setErrorMessage(err.message);
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Completing sign in...</h2>
            <p className="text-muted-foreground">Please wait while we redirect you.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Success!</h2>
            <p className="text-muted-foreground">You've been signed in successfully.</p>
            <p className="text-sm text-muted-foreground">Redirecting to home page...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">Authentication Failed</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;