# Formul8 Baseline Questions Summary

**Generated:** 2025-10-23T23:22:22.850Z
**Total Questions:** 21
**Total Sources:** 6

## Source Repositories

- [compliance-agent](https://github.com/F8ai/compliance-agent) - 16 questions
- [science-agent](https://github.com/F8ai/science-agent) - 1 questions
- [formulation-agent](https://github.com/F8ai/formulation-agent) - 1 questions
- [spectra-agent](https://github.com/F8ai/spectra-agent) - 1 questions
- [customer-success-agent](https://github.com/F8ai/customer-success-agent) - 1 questions
- [ad-agent](https://github.com/F8ai/ad-agent) - 1 questions

## Questions by Category

- **licensing**: 5 questions
- **labeling**: 4 questions
- **testing**: 3 questions
- **security**: 3 questions
- **taxation**: 1 questions
- **science**: 1 questions
- **formulation**: 1 questions
- **spectra**: 1 questions
- **customer-success**: 1 questions
- **ad**: 1 questions

## Questions by Tier

- **standard**: 5 questions

## Sample Questions

1. **What are the key requirements for cannabis regulatory compliance?**
   - Category: licensing
   - Source: compliance-agent
   - Tier: N/A
   - Expected Agent: N/A

2. **What testing requirements must cannabis products meet before retail sale?**
   - Category: testing
   - Source: compliance-agent
   - Tier: N/A
   - Expected Agent: N/A

3. **What security requirements are mandatory for cannabis facilities?**
   - Category: security
   - Source: compliance-agent
   - Tier: N/A
   - Expected Agent: N/A

4. **How should cannabis products be properly labeled for retail sale?**
   - Category: labeling
   - Source: compliance-agent
   - Tier: N/A
   - Expected Agent: N/A

5. **How do excise tax rates differ between Colorado, California, and Washington for cannabis products?**
   - Category: taxation
   - Source: compliance-agent
   - Tier: N/A
   - Expected Agent: N/A

6. **Example question for science-agent**
   - Category: science
   - Source: science-agent
   - Tier: standard
   - Expected Agent: science-agent

7. **Example question for formulation-agent**
   - Category: formulation
   - Source: formulation-agent
   - Tier: standard
   - Expected Agent: formulation-agent

8. **Example question for spectra-agent**
   - Category: spectra
   - Source: spectra-agent
   - Tier: standard
   - Expected Agent: spectra-agent

9. **Example question for customer-success-agent**
   - Category: customer-success
   - Source: customer-success-agent
   - Tier: standard
   - Expected Agent: customer-success-agent

10. **Example question for ad-agent**
   - Category: ad
   - Source: ad-agent
   - Tier: standard
   - Expected Agent: ad-agent


## Usage

The baseline questions are used by:
- Chat interface typewriter effect
- Automated testing
- Agent routing validation
- Performance benchmarking

## Updating

To update the master baseline.json:

```bash
node scripts/collect-baselines-from-repos.js
```

This will:
1. Clone/pull all agent repositories
2. Extract baseline.json from each
3. Concatenate into master baseline.json
4. Generate this summary
