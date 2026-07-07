export const assignReplacement = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      replacementFacultyId, 
      replacementFacultyName, 
      replacementFacultyEmail 
    } = req.body;


    if (!replacementFacultyId || !replacementFacultyName) {
      return res.status(400).json({
        success: false,
        error: "Replacement faculty ID and name are required"
      });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      {
        $set: {
          replacementFacultyId,
          replacementFacultyName,
          replacementFacultyEmail: replacementFacultyEmail || null,
          replacementAssigned: true
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        success: false,
        error: "Leave not found"
      });
    }

    console.log("Updated leave:", updatedLeave);

    res.status(200).json({
      success: true,
      message: "Replacement assigned successfully",
      data: updatedLeave
    });

  } catch (error) {
    console.error("Error assigning replacement:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};