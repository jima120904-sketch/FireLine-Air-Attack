using System;

namespace FireWing.Data
{
    /// <summary>Lift, drag, and speed limits for one selectable flap stage.</summary>
    [Serializable]
    public sealed class FlapSetting
    {
        /// <summary>Inspector label for this flap stage.</summary>
        public string displayName = "Takeoff";

        /// <summary>Lift coefficient added while this stage is selected.</summary>
        public float extraLiftCoefficient = 0.25f;

        /// <summary>Drag coefficient added while this stage is selected.</summary>
        public float extraDragCoefficient = 0.035f;

        /// <summary>Multiplier applied to clean stall speed.</summary>
        public float stallSpeedMultiplier = 0.88f;

        /// <summary>Maximum safe speed in meters per second for this stage.</summary>
        public float maximumSpeedMps = 55f;
    }
}