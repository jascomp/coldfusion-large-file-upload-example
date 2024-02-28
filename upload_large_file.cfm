<cfscript>
    if (compareNoCase(cgi.request_method, "post") eq 0) {
        /*
            ColdFusion will take the binary data supplied in the form.chunk variable
            and write it to a temporary file on the server and then provide the path to that
            temp file in the form.chunk variable.
        */
        binaryChunk = fileReadBinary(form.chunk);

        /*
            Make sure to cleanup the temporary file because we are still utlimately going to be upload a 
            large file to the server.  We don't want the server drive that holds the ColdFusion temp directory
            to fill up
        */
        fileDelete(form.chunk);

        uploadedFile = expandPath("path/to/uploads/#form.filename#");
        if (form.chunknumber eq 1 AND fileExists(uploadedFile))
            fileDelete(uploadedFile);  // Overwrite the file if it already exists

        // Now we can append the binary data to the file we are uploading to the server
        uploadFile = fileOpen(uploadedFile,"append");
    
        // Write the binary data to the file
        fileWrite(uploadFile,binaryChunk);

        // Close the file
        fileClose(uploadFile);
    }
</cfscript>

<cfcontent type="application/json" reset="true"><cfoutput>#serializeJSON({"success":true})#</cfoutput>