import svgPaths from "./svg-ag0wrj6jz7";
import imgAbstractAudioWave from "figma:asset/f792489bfe5f75441aadbd706c88a56ec3dd53ab.png";

function Button() {
  return (
    <div className="bg-gradient-to-r content-stretch flex from-[#eb65ff] items-center justify-center px-[32px] py-[12px] relative rounded-[9999px] shadow-[0px_0px_20px_0px_rgba(235,101,255,0.3)] shrink-0 to-[#ff9157]" data-name="Button">
      <div className="flex flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold h-[20px] justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white tracking-[1.4px] uppercase w-[117.92px]">
        <p className="leading-[20px]">FEELING LUCKY</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="absolute bg-gradient-to-r blur-[12px] from-[#eb65ff] inset-[-4px] opacity-40 rounded-[9999px] to-[#ff9157]" data-name="Gradient+Blur" />
      <Button />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-center opacity-60 relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[15px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[10px] text-center tracking-[1px] uppercase w-[171.2px]">
        <p className="leading-[15px]">Generate random symphony</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0" data-name="Margin">
      <Container1 />
    </div>
  );
}

function SectionHeroArea() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center py-[16px] relative shrink-0 w-full" data-name="Section - Hero Area">
      <Container />
      <Margin />
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16.5">
        <g id="Container">
          <path d={svgPaths.p10064180} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container3 />
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[12px] relative shrink-0 w-[13px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 12">
        <g id="Container">
          <path d={svgPaths.p2ee7f2e0} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[17.5px] relative shrink-0 w-[13.75px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.75 17.5">
        <g id="Container">
          <path d={svgPaths.p2a37fc00} fill="var(--fill-0, #DEE5FF)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[rgba(25,37,64,0.4)] content-stretch flex flex-col items-center justify-center p-[13px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Container6 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[12px] relative shrink-0 w-[13px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 12">
        <g id="Container">
          <path d={svgPaths.p6f94780} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <Container7 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Button2 />
      <Button3 />
      <Button4 />
    </div>
  );
}

function Container8() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Container">
          <path d={svgPaths.p24996380} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-gradient-to-r content-stretch flex flex-col from-[#eb65ff] items-center justify-center p-[8px] relative rounded-[9999px] shadow-[0px_0px_12px_0px_rgba(235,101,255,0.4)] shrink-0 to-[#ff9157]" data-name="Button">
      <Container8 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[8px] relative w-full">
          <Button1 />
          <Container4 />
          <Button5 />
        </div>
      </div>
    </div>
  );
}

function SectionTransportControls() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] relative rounded-[48px] shrink-0 w-full" data-name="Section - Transport Controls">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[48px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col items-center p-[17px] relative w-full">
          <Container2 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="Container">
          <path d={svgPaths.p247c2f00} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-80 relative rounded-[2px] shrink-0 size-[32px]" data-name="Background" style={{ backgroundImage: "linear-gradient(135deg, rgb(129, 236, 255) 0%, rgb(235, 101, 255) 100%)" }}>
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[9px] tracking-[0.9px] uppercase w-[49.11px]">
        <p className="leading-[11.25px]">Control</p>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Space_Grotesk:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] relative shrink-0 text-[#dee5ff] text-[14px] w-[106.67px]">
        <p className="leading-[20px]">Color Picker (AI)</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[106.67px]" data-name="Container">
      <Container12 />
      <Heading1 />
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">
        <Background />
        <Container11 />
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Container">
          <path d={svgPaths.p24996380} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0" data-name="Button">
      <Container14 />
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[5.55px] relative shrink-0 w-[9px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5.55">
        <g id="Container">
          <path d={svgPaths.p4ab6c80} fill="var(--fill-0, #40485D)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative">
        <Button6 />
        <Container15 />
      </div>
    </div>
  );
}

function ColorPickerCard() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] col-1 h-[70px] justify-self-stretch relative rounded-[32px] row-1 shrink-0" data-name="Color Picker Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[15px] relative size-full">
          <Container9 />
          <Container13 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function Container17() {
  return (
    <div className="relative shrink-0 size-[13.5px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.5 13.5">
        <g id="Container">
          <path d={svgPaths.p349f4380} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background1() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-80 relative rounded-[2px] shrink-0 size-[32px]" data-name="Background" style={{ backgroundImage: "linear-gradient(135deg, rgb(255, 145, 87) 0%, rgb(235, 101, 255) 100%)" }}>
      <Container17 />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[9px] tracking-[0.9px] uppercase w-[46.44px]">
        <p className="leading-[11.25px]">Texture</p>
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Space_Grotesk:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] relative shrink-0 text-[#dee5ff] text-[14px] w-[65.3px]">
        <p className="leading-[20px]">Gradients</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[65.3px]" data-name="Container">
      <Container19 />
      <Heading2 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">
        <Background1 />
        <Container18 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Container">
          <path d={svgPaths.p24996380} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0" data-name="Button">
      <Container21 />
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[5.55px] relative shrink-0 w-[9px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5.55">
        <g id="Container">
          <path d={svgPaths.p4ab6c80} fill="var(--fill-0, #40485D)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container20() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative">
        <Button7 />
        <Container22 />
      </div>
    </div>
  );
}

function GradientsCard() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] col-1 h-[70px] justify-self-stretch relative rounded-[32px] row-2 shrink-0" data-name="Gradients Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[15px] relative size-full">
          <Container16 />
          <Container20 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function Container24() {
  return (
    <div className="relative shrink-0 size-[15.75px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.75 15.75">
        <g id="Container">
          <path d={svgPaths.p39238880} fill="var(--fill-0, #FF9157)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#192540] content-stretch flex items-center justify-center p-px relative rounded-[2px] shrink-0 size-[32px]" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(64,72,93,0.3)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <Container24 />
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[9px] tracking-[0.9px] uppercase w-[48.94px]">
        <p className="leading-[11.25px]">Enhance</p>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Space_Grotesk:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] relative shrink-0 text-[#dee5ff] text-[14px] w-[48.22px]">
        <p className="leading-[20px]">Effects</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[48.94px]" data-name="Container">
      <Container26 />
      <Heading3 />
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">
        <BackgroundBorder />
        <Container25 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Container">
          <path d={svgPaths.p24996380} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button8() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0" data-name="Button">
      <Container28 />
    </div>
  );
}

function Container29() {
  return (
    <div className="h-[5.55px] relative shrink-0 w-[9px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5.55">
        <g id="Container">
          <path d={svgPaths.p4ab6c80} fill="var(--fill-0, #40485D)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container27() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative">
        <Button8 />
        <Container29 />
      </div>
    </div>
  );
}

function EffectsCard() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] col-1 h-[70px] justify-self-stretch relative rounded-[32px] row-3 shrink-0" data-name="Effects Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[15px] relative size-full">
          <Container23 />
          <Container27 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="Container">
          <path d={svgPaths.p19a6eb40} fill="var(--fill-0, #EB65FF)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#192540] content-stretch flex items-center justify-center p-px relative rounded-[2px] shrink-0 size-[32px]" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(64,72,93,0.3)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <Container31 />
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[9px] tracking-[0.9px] uppercase w-[40.63px]">
        <p className="leading-[11.25px]">System</p>
      </div>
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Space_Grotesk:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] relative shrink-0 text-[#dee5ff] text-[14px] w-[84.53px]">
        <p className="leading-[20px]">Audiovisuals</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[84.53px]" data-name="Container">
      <Container33 />
      <Heading4 />
    </div>
  );
}

function Container30() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">
        <BackgroundBorder1 />
        <Container32 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Container">
          <path d={svgPaths.p24996380} fill="var(--fill-0, #A3AAC4)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonRandomize() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[6px] relative shrink-0" data-name="Button - Randomize">
      <Container35 />
    </div>
  );
}

function LabelToggleSwitch() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Label - Toggle Switch">
      <div className="bg-[#ff9157] h-[20px] relative rounded-[9999px] shrink-0 w-[40px]" data-name="Background+Shadow">
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="absolute bg-white left-[18px] rounded-[9999px] size-[16px] top-[2px]" data-name="Background+Border">
        <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative">
        <ButtonRandomize />
        <LabelToggleSwitch />
      </div>
    </div>
  );
}

function AudiovisualsToggleCard() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] col-1 h-[70px] justify-self-stretch relative rounded-[32px] row-4 shrink-0" data-name="Audiovisuals Toggle Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[15px] relative size-full">
          <Container30 />
          <Container34 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

function SectionConfigurationCardsGrid() {
  return (
    <div className="gap-x-[12px] gap-y-[12px] grid grid-cols-[repeat(1,minmax(0,1fr))] grid-rows-[____70px_70px_70px_70px] relative shrink-0 w-full" data-name="Section - Configuration Cards Grid">
      <ColorPickerCard />
      <GradientsCard />
      <EffectsCard />
      <AudiovisualsToggleCard />
    </div>
  );
}

function AbstractAudioWave() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px mix-blend-screen opacity-50 relative w-full" data-name="Abstract audio wave">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[250.7%] left-0 max-w-none top-[-75.35%] w-full" src={imgAbstractAudioWave} />
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[15px] justify-center leading-[0] relative shrink-0 text-[#a3aac4] text-[10px] w-[127.75px]">
        <p className="leading-[15px]">24-BIT LOSSLESS • 44.1 KHZ</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute bottom-[13px] left-[17px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[0.5px] items-start relative">
        <div className="flex flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold h-[24px] justify-center leading-[0] relative shrink-0 text-[#dee5ff] text-[16px] w-[178.92px]">
          <p className="leading-[24px]">CYBERPUNK_DRIVE.wav</p>
        </div>
        <Container37 />
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute bottom-[13px] h-[24px] right-[17px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] h-full items-end relative">
        <div className="bg-[#ff9157] h-[9.59px] rounded-[9999px] shrink-0 w-[2px]" data-name="Vertical Divider" />
        <div className="bg-[#eb65ff] h-[19.19px] rounded-[9999px] shrink-0 w-[2px]" data-name="Vertical Divider" />
        <div className="bg-[#ff9157] h-full rounded-[9999px] shrink-0 w-[2px]" data-name="Vertical Divider" />
        <div className="bg-[#eb65ff] h-[14.39px] rounded-[9999px] shrink-0 w-[2px]" data-name="Vertical Divider" />
        <div className="bg-[#ff9157] h-[7.19px] rounded-[9999px] shrink-0 w-[2px]" data-name="Vertical Divider" />
      </div>
    </div>
  );
}

function SectionVisualizerPreview() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(25,37,64,0.4)] h-[144px] relative rounded-[32px] shrink-0 w-full" data-name="Section - Visualizer Preview">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
        <AbstractAudioWave />
        <div className="absolute bg-gradient-to-t from-[rgba(6,14,32,0.8)] inset-px to-[rgba(6,14,32,0)]" data-name="Gradient" />
        <Container36 />
        <Container38 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[32px]" />
    </div>
  );
}

function Main() {
  return (
    <div className="max-w-[896px] relative shrink-0 w-full" data-name="Main">
      <div className="content-stretch flex flex-col gap-[16px] items-start max-w-[inherit] pb-[96px] pt-[64px] px-[16px] relative w-full">
        <SectionHeroArea />
        <SectionTransportControls />
        <SectionConfigurationCardsGrid />
        <SectionVisualizerPreview />
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="relative shrink-0 size-[15.833px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8333 15.8333">
        <g id="Container">
          <path d={svgPaths.p17c83c80} fill="var(--fill-0, #FF9157)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 1">
      <div className="bg-clip-text bg-gradient-to-r flex flex-col font-['Space_Grotesk:Bold',sans-serif] font-bold from-[#eb65ff] h-[28px] justify-center leading-[0] relative shrink-0 text-[18px] text-[transparent] to-[#ff9157] tracking-[-0.45px] w-[129.03px]">
        <p className="leading-[28px]">VISUALIZER PRO</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
      <Container40 />
      <Heading />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[16.667px] relative shrink-0 w-[16.75px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.75 16.6667">
        <g id="Container">
          <path d={svgPaths.p18e22d80} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button9() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-name="Button">
      <Container41 />
    </div>
  );
}

function HeaderTopAppBar() {
  return (
    <div className="absolute backdrop-blur-[12px] bg-[rgba(2,6,23,0.4)] content-stretch flex items-center justify-between left-0 px-[24px] py-[12px] rounded-bl-[16px] rounded-br-[16px] shadow-[0px_8px_32px_0px_rgba(222,229,255,0.08)] top-0 w-[390px]" data-name="Header - TopAppBar">
      <Container39 />
      <Button9 />
    </div>
  );
}

function Container42() {
  return (
    <div className="h-[11.667px] relative shrink-0 w-[9.167px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.16667 11.6667">
        <g id="Container">
          <path d={svgPaths.p3edf7c80} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button10() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative">
        <Container42 />
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="Container">
          <path d={svgPaths.p16de5f80} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button11() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative">
        <Container43 />
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="h-[10px] relative shrink-0 w-[10.833px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.8333 10">
        <g id="Container">
          <path d={svgPaths.p194dd000} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button12() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative">
        <Container44 />
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="h-[18.333px] relative shrink-0 w-[13.333px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 18.3333">
        <g id="Container">
          <path d={svgPaths.p18a83280} fill="var(--fill-0, #94A3B8)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button13() {
  return (
    <div className="relative shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative">
        <Container45 />
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="relative shrink-0 size-[13.333px]" data-name="Container">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3333">
        <g id="Container">
          <path d={svgPaths.p1b604d00} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button14() {
  return (
    <div className="bg-gradient-to-r from-[#eb65ff] relative rounded-[9999px] shadow-[0px_0px_12px_0px_rgba(235,101,255,0.4)] shrink-0 to-[#ff9157]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative">
        <Container46 />
      </div>
    </div>
  );
}

function BottomNavBar() {
  return (
    <div className="absolute backdrop-blur-[20px] bg-[rgba(15,23,42,0.6)] bottom-[16px] content-stretch flex items-center justify-between left-[15.6px] max-w-[512px] pl-[21px] pr-[21.05px] py-[9px] rounded-[9999px] w-[358.8px]" data-name="BottomNavBar">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[9999px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)]" />
      <Button10 />
      <Button11 />
      <Button12 />
      <Button13 />
      <Button14 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.1)]" />
    </div>
  );
}

export default function Body() {
  return (
    <div className="bg-[#060e20] content-stretch flex flex-col items-start pb-[21px] relative size-full" data-name="Body">
      <Main />
      <HeaderTopAppBar />
      <BottomNavBar />
    </div>
  );
}